import {Box, Button, CircularProgress, Input, InputLabel, MenuItem, Select, TextField, Typography} from "@mui/material";
import {useEffect, useState} from "react";
import {Save} from "@mui/icons-material";
import {ModalWrapper} from "../common/ModalWrapper.tsx";
import {useGetFileTypes, useUpdateSnippetFull} from "../../utils/queries.tsx";
import {useSnackbarContext} from "../../contexts/snackbarContext.tsx";
import {Snippet} from "../../utils/snippet.ts";

type EditSnippetModalProps = {
  open: boolean;
  onClose: () => void;
  snippet: Snippet;
  /** Current (possibly edited) editor content, saved together with the metadata */
  content: string;
  onSaved: () => void;
}

export const EditSnippetModal = ({open, onClose, snippet, content, onSaved}: EditSnippetModalProps) => {
  const [name, setName] = useState(snippet.name)
  const [description, setDescription] = useState(snippet.description)
  const [language, setLanguage] = useState(snippet.language)
  const [languageVersion, setLanguageVersion] = useState(snippet.languageVersion)
  const {data: fileTypes} = useGetFileTypes()
  const {createSnackbar} = useSnackbarContext()
  const {mutateAsync: updateSnippet, isLoading} = useUpdateSnippetFull({onSuccess: onSaved})

  useEffect(() => {
    if (open) {
      setName(snippet.name)
      setDescription(snippet.description)
      setLanguage(snippet.language)
      setLanguageVersion(snippet.languageVersion)
    }
  }, [open, snippet]);

  const handleSave = async () => {
    try {
      await updateSnippet({id: snippet.id, updateSnippet: {name, description, language, languageVersion, content}})
      createSnackbar('success', 'Snippet updated')
      onClose()
    } catch (e) {
      createSnackbar('error', e instanceof Error ? e.message : 'Could not update snippet')
    }
  }

  return (
      <ModalWrapper open={open} onClose={onClose}>
        <Box sx={{display: 'flex', flexDirection: "row", justifyContent: "space-between"}}>
          <Typography variant="h5" component="h2" sx={{display: 'flex', alignItems: 'center'}}>
            Edit Snippet
          </Typography>
          <Button variant="contained" disableRipple sx={{boxShadow: 0}} onClick={handleSave}
                  disabled={!name.trim() || !language || !languageVersion.trim() || isLoading}>
            <Box pr={1} display={"flex"} alignItems={"center"}>
              {isLoading ? <CircularProgress size={24}/> : <Save/>}
            </Box>
            Save
          </Button>
        </Box>
        <Box sx={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          <InputLabel htmlFor="edit-name">Name</InputLabel>
          <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} sx={{width: '50%'}}/>
          <TextField label="Description" value={description} onChange={e => setDescription(e.target.value)}
                     multiline rows={3} fullWidth/>
          <InputLabel id="edit-language-label">Language</InputLabel>
          <Select labelId="edit-language-label" value={language} sx={{width: '50%'}}
                  onChange={e => setLanguage(e.target.value)}>
            {fileTypes?.map(x => <MenuItem key={x.language} value={x.language}>{x.language}</MenuItem>)}
          </Select>
          <InputLabel htmlFor="edit-language-version">Language Version</InputLabel>
          <Input id="edit-language-version" value={languageVersion}
                 onChange={e => setLanguageVersion(e.target.value)} sx={{width: '50%'}}/>
        </Box>
      </ModalWrapper>
  )
}
