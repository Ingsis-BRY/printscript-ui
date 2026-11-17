import {
    Alert,
    Box,
    Button,
    capitalize,
    CircularProgress,
    Input,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    TextField,
    Typography
} from "@mui/material";
import {useEffect, useState} from "react";
import Editor from "react-simple-code-editor";

import "prismjs/themes/prism-okaidia.css";
import {Save} from "@mui/icons-material";
import {CreateSnippet, CreateSnippetWithLang} from "../../utils/snippet.ts";
import {ModalWrapper} from "../common/ModalWrapper.tsx";
import {useCreateSnippet, useCreateSnippetFromFile, useGetFileTypes} from "../../utils/queries.tsx";
import {useSnackbarContext} from "../../contexts/snackbarContext.tsx";
import {queryClient} from "../../App.tsx";
import {highlightCode} from "../../utils/editorHighlight.ts";
import {describeError, getErrorSpan} from "../../utils/http/problem.ts";

export const AddSnippetModal = ({open, onClose, defaultSnippet, file}: {
    open: boolean,
    onClose: () => void,
    defaultSnippet?: CreateSnippetWithLang,
    file?: File
}) => {
    const [language, setLanguage] = useState(defaultSnippet?.language ?? "printscript");
    const [description, setDescription] = useState("");
    const [languageVersion, setLanguageVersion] = useState("");
    const [code, setCode] = useState(defaultSnippet?.content ?? "");
    const [snippetName, setSnippetName] = useState(defaultSnippet?.name ?? "")
    const [errorLine, setErrorLine] = useState<number | undefined>()
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const {mutateAsync: createSnippet, isLoading: loadingSnippet} = useCreateSnippet({
        onSuccess: () => queryClient.invalidateQueries('listSnippets')
    })
    const {mutateAsync: createSnippetFromFile, isLoading: loadingUpload} = useCreateSnippetFromFile({
        onSuccess: () => queryClient.invalidateQueries('listSnippets')
    })
    const {data: fileTypes} = useGetFileTypes();
    const {createSnackbar} = useSnackbarContext()
    const versions = fileTypes?.find(f => f.language === language)?.versions ?? []

    const clearError = () => {
        setErrorLine(undefined)
        setErrorMessage(null)
    }

    const handleCreateSnippet = async () => {
        const extension = fileTypes?.find((f) => f.language === language)?.extension ?? "prs"
        clearError()
        try {
            if (file) {
                // Upload the original file, or the edited code if it was modified in the editor
                const toUpload = code === defaultSnippet?.content ? file : new File([code], file.name, {type: "text/plain"})
                await createSnippetFromFile({
                    name: snippetName,
                    description,
                    language,
                    languageVersion,
                    file: toUpload,
                    extension,
                })
            } else {
                await createSnippet(buildSnippet(extension))
            }
            onClose();
        } catch (e) {
            const message = describeError(e, 'Could not create snippet')
            setErrorLine(getErrorSpan(e)?.start.line)
            setErrorMessage(message)
            createSnackbar('error', message)
        }
    }

    const buildSnippet = (extension: string): CreateSnippet => {
        const newSnippet: CreateSnippet = {
            name: snippetName,
            description,
            content: code,
            language: language,
            languageVersion,
            extension
        }
        return newSnippet
    }

    // Preselect the newest version of the chosen language
    useEffect(() => {
        if (!open) return
        const available = fileTypes?.find(f => f.language === language)?.versions ?? []
        setLanguageVersion(available.at(-1) ?? "")
    }, [language, fileTypes, open]);

    useEffect(() => {
        if (defaultSnippet) {
            setCode(defaultSnippet?.content)
            setLanguage(defaultSnippet?.language)
            setSnippetName(defaultSnippet?.name)
        }
    }, [defaultSnippet]);

    return (
        <ModalWrapper open={open} onClose={onClose}>
            {
                <Box sx={{display: 'flex', flexDirection: "row", justifyContent: "space-between"}}>
                    <Typography id="modal-modal-title" variant="h5" component="h2"
                                sx={{display: 'flex', alignItems: 'center'}}>
                        Add Snippet
                    </Typography>
                    <Button disabled={
                        !snippetName.trim() ||
                        !description.trim() ||
                        !code.trim() ||
                        !language ||
                        !languageVersion ||
                        loadingSnippet ||
                        loadingUpload
                    } variant="contained" data-testid="save-snippet-button"
                            disableRipple
                            sx={{boxShadow: 0}} onClick={handleCreateSnippet}>
                        <Box pr={1} display={"flex"} alignItems={"center"} justifyContent={"center"}>
                            {loadingSnippet || loadingUpload ? <CircularProgress size={24}/> : <Save/>}
                        </Box>
                        Save Snippet
                    </Button>
                </Box>
            }
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <InputLabel htmlFor="name">Name</InputLabel>
                <Input onChange={e => setSnippetName(e.target.value)} value={snippetName} id="name"
                       sx={{width: '50%'}}/>
            </Box>
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <InputLabel id="language-label">Language</InputLabel>
                <Select
                    labelId="language-label"
                    id="demo-simple-select"
                    value={language}
                    label="Language"
                    onChange={(e: SelectChangeEvent) => setLanguage(e.target.value)}
                    SelectDisplayProps={{'data-testid': 'language-select'} as object}
                    sx={{width: '50%'}}
                >
                    {
                        fileTypes?.map(x => (
                            <MenuItem data-testid={`menu-option-${x.language}`} key={x.language}
                                      value={x.language}>{capitalize((x.language))}</MenuItem>
                        ))
                    }
                </Select>
                <TextField
                    label="Description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    inputProps={{'data-testid': 'description-input'}}
                    multiline
                    rows={3}
                    fullWidth
                />
                <InputLabel id="language-version-label">Language Version</InputLabel>
                <Select
                    labelId="language-version-label"
                    id="language-version"
                    value={languageVersion}
                    onChange={(e: SelectChangeEvent) => setLanguageVersion(e.target.value)}
                    SelectDisplayProps={{'data-testid': 'version-select'} as object}
                    sx={{width: '50%'}}
                >
                    {versions.map(v => <MenuItem key={v} value={v} data-testid={`version-option-${v}`}>{v}</MenuItem>)}
                </Select>
            </Box>
            <InputLabel>Code Snippet</InputLabel>
            <Box width={"100%"} sx={{
                backgroundColor: 'black', color: 'white', borderRadius: "8px",
            }}>
                <Editor
                    value={code}
                    padding={10}
                    data-testid={"add-snippet-code-editor"}
                    textareaId="add-snippet-editor"
                    onValueChange={(code) => {
                        setCode(code)
                        clearError()
                    }}
                    highlight={(code) => highlightCode(code, errorLine)}
                    style={{
                        borderRadius: "8px",
                        overflow: "auto",
                        minHeight: "300px",
                        maxHeight: "600px",
                        width: "100%",
                        fontFamily: "monospace",
                        fontSize: 17,
                    }}
                />
            </Box>
            {errorMessage && <Alert severity="error" data-testid="add-snippet-error">{errorMessage}</Alert>}
        </ModalWrapper>
    )
}

