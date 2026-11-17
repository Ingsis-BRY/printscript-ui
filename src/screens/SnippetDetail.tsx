import {useEffect, useRef, useState} from "react";
import Editor from "react-simple-code-editor";
import "prismjs/themes/prism-okaidia.css";
import {Alert, Box, Chip, CircularProgress, IconButton, List, ListItem, ListItemText, Tooltip, Typography} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import {
  useDownloadSnippet,
  useGetFileTypes,
  useUpdateSnippetById,
  useUpdateSnippetFromFile
} from "../utils/queries.tsx";
import {useFormatSnippet, useGetSnippetById, useShareSnippet} from "../utils/queries.tsx";
import {Bòx} from "../components/snippet-table/SnippetBox.tsx";
import {BugReport, Delete, Download, Edit, FileUpload, PlayArrow, Save, Share, StopRounded} from "@mui/icons-material";
import {ShareSnippetModal} from "../components/snippet-detail/ShareSnippetModal.tsx";
import {TestSnippetModal} from "../components/snippet-test/TestSnippetModal.tsx";
import {Snippet, SnippetDownloadVersion} from "../utils/snippet.ts";
import {useSnackbarContext} from "../contexts/snackbarContext.tsx";
import {EditSnippetModal} from "../components/snippet-detail/EditSnippetModal.tsx";
import {SnippetExecution} from "./SnippetExecution.tsx";
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import {queryClient} from "../App.tsx";
import {highlightCode} from "../utils/editorHighlight.ts";
import {describeError, getErrorSpan} from "../utils/http/problem.ts";
import {ComplianceChip} from "../components/snippet-table/SnippetRow.tsx";
import {DeleteConfirmationModal} from "../components/snippet-detail/DeleteConfirmationModal.tsx";

type SnippetDetailProps = {
  id: string;
  handleCloseModal: () => void;
}

const DownloadButton = ({snippet, version}: { snippet?: Snippet, version: SnippetDownloadVersion }) => {
  const {mutate: download, isLoading} = useDownloadSnippet()
  const {data: fileTypes} = useGetFileTypes()
  const {createSnackbar} = useSnackbarContext()
  if (!snippet) return null;

  const handleDownload = () => {
    const extension = fileTypes?.find(f => f.language === snippet.language)?.extension ?? "prs"
    download({id: snippet.id, version}, {
      onSuccess: (blob) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${snippet.name}${version === "formatted" ? ".formatted" : ""}.${extension}`
        link.click()
        URL.revokeObjectURL(url)
      },
      onError: (e) => createSnackbar('error', e.message)
    })
  }

  return (
    <Tooltip title={`Download ${version}`}>
      <span>
        <IconButton onClick={handleDownload} disabled={isLoading} sx={{cursor: "pointer"}} data-testid={`download-${version}`}>
          <Download color={version === "formatted" ? "primary" : "inherit"}/>
        </IconButton>
      </span>
    </Tooltip>
  )
}

export const SnippetDetail = (props: SnippetDetailProps) => {
  const {id, handleCloseModal} = props;
  const [code, setCode] = useState(
      ""
  );
  const [shareModalOppened, setShareModalOppened] = useState(false)
  const [deleteConfirmationModalOpen, setDeleteConfirmationModalOpen] = useState(false)
  const [testModalOpened, setTestModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [runSnippet, setRunSnippet] = useState(false);
  const [errorLine, setErrorLine] = useState<number | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {createSnackbar} = useSnackbarContext()

  const {data: snippet, isLoading} = useGetSnippetById(id);
  const {mutate: shareSnippet, isLoading: loadingShare} = useShareSnippet()
  const {mutate: formatSnippet, isLoading: isFormatLoading} = useFormatSnippet(id)
  const {mutate: updateSnippet, isLoading: isUpdateSnippetLoading} = useUpdateSnippetById({
    onSuccess: () => {
      queryClient.invalidateQueries(['snippet', id])
      queryClient.invalidateQueries(['testCases', id])
      queryClient.invalidateQueries('listSnippets')
    }
  })
  const canEdit = snippet?.isOwner !== false

  const showError = (e: unknown, fallback: string) => {
    const message = describeError(e, fallback)
    setErrorLine(getErrorSpan(e)?.start.line)
    setErrorMessage(message)
    createSnackbar('error', message)
  }

  const clearError = () => {
    setErrorLine(undefined)
    setErrorMessage(null)
  }

  const {mutate: updateFromFile, isLoading: isUploading} = useUpdateSnippetFromFile({
    onSuccess: () => {
      queryClient.invalidateQueries(['snippet', id])
      queryClient.invalidateQueries(['testCases', id])
      queryClient.invalidateQueries('listSnippets')
      createSnackbar('success', 'Snippet updated from file')
    }
  })

  const handleUpdateFromFile = (input: HTMLInputElement) => {
    const file = input.files?.[0]
    input.value = ""
    if (!file || !snippet) return
    updateFromFile({
      id,
      data: {
        name: snippet.name,
        description: snippet.description,
        language: snippet.language,
        languageVersion: snippet.languageVersion,
        extension: snippet.extension,
        file
      }
    }, {onError: (e) => showError(e, 'Could not update from file')})
  }

  const syncedRef = useRef<{ id?: string, content?: string }>({});
  const snippetId = snippet?.id
  const snippetContent = snippet?.content
  useEffect(() => {
    if (snippetId === undefined || snippetContent === undefined) return
    const last = syncedRef.current
    const sameSnippet = last.id === snippetId
    if (sameSnippet && last.content === snippetContent) return
    // Same snippet with new server content: keep unsaved local edits.
    const dirty = sameSnippet && code !== last.content
    syncedRef.current = {id: snippetId, content: snippetContent}
    if (dirty) return
    setCode(snippetContent)
    clearError()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snippetId, snippetContent]);

  const handleFormat = () => {
    clearError()
    formatSnippet(code, {
      onSuccess: (formatted) => setCode(formatted),
      onError: (e) => showError(e, 'Could not format the snippet')
    })
  }

  const handleSave = () => {
    clearError()
    updateSnippet({id: id, updateSnippet: {content: code}}, {onError: (e) => showError(e, 'Could not save the snippet')})
  }


  async function handleShareSnippet(userId: string) {
    shareSnippet({snippetId: id, userId}, {
      onSuccess: () => {
        setShareModalOppened(false)
        createSnackbar('success', 'Snippet shared')
      },
      onError: (e) => createSnackbar('error', e.message)
    })
  }

  return (
      <Box p={4} minWidth={'60vw'}>
        <Box width={'100%'} p={2} display={'flex'} justifyContent={'flex-end'}>
          <CloseIcon style={{cursor: "pointer"}} onClick={handleCloseModal}/>
        </Box>
        {
          isLoading ? (<>
            <Typography fontWeight={"bold"} mb={2} variant="h4">Loading...</Typography>
            <CircularProgress/>
          </>) : <>
            <Typography variant="h4" fontWeight={"bold"}>{snippet?.name ?? "Snippet"}</Typography>
            {snippet && (
              <Box display="flex" flexDirection="column" gap={1} px={1}>
                {snippet.description && <Typography data-testid="snippet-description">{snippet.description}</Typography>}
                <Box display="flex" flexDirection="row" alignItems="center" gap={2} flexWrap="wrap">
                  <Typography variant="body2" color="text.secondary" data-testid="snippet-language">
                    {snippet.language} {snippet.languageVersion}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Author: {snippet.author}</Typography>
                  <ComplianceChip compliance={snippet.compliance}/>
                  {snippet.processing === 'pending' &&
                      <Chip size="small" label="processing" icon={<CircularProgress size={12}/>}/>}
                  {snippet.processing === 'failed' && <Chip size="small" color="warning" label="processing failed"/>}
                  {snippet.formatStatus && (
                      <Chip size="small" variant="outlined" label={`formatted: ${snippet.formatStatus}`}/>
                  )}
                </Box>
                {snippet.validationError && (
                    <Alert severity="error" data-testid="validation-error">
                      Invalid since the parser upgrade: {snippet.validationError.rule} — {snippet.validationError.message}
                      {snippet.validationError.span && ` (line ${snippet.validationError.span.start.line}, column ${snippet.validationError.span.start.column})`}
                    </Alert>
                )}
                {snippet.lintIssues && snippet.lintIssues.length > 0 && (
                    <Box>
                      <Typography fontWeight="bold">Lint issues</Typography>
                      <List dense disablePadding data-testid="lint-issues">
                        {snippet.lintIssues.map((issue, i) => (
                            <ListItem key={`${issue.rule}-${i}`} disableGutters>
                              <ListItemText
                                  primary={`${issue.rule}: ${issue.message}`}
                                  secondary={issue.span ? `${issue.span.start.line}:${issue.span.start.column}` : undefined}/>
                            </ListItem>
                        ))}
                      </List>
                    </Box>
                )}
              </Box>
            )}
            <Box display="flex" flexDirection="row" gap="8px" padding="8px">
              <Tooltip title={"Share"}>
                <span><IconButton onClick={() => setShareModalOppened(true)} disabled={!canEdit} data-testid="share-button">
                  <Share/>
                </IconButton></span>
              </Tooltip>
              <Tooltip title={"Test"}>
                <IconButton onClick={() => setTestModalOpened(true)} data-testid="test-button">
                  <BugReport/>
                </IconButton>
              </Tooltip>
              <Tooltip title={"Edit details"}>
                <span><IconButton onClick={() => setEditModalOpened(true)} disabled={!canEdit} data-testid="edit-button">
                  <Edit/>
                </IconButton></span>
              </Tooltip>
              <Tooltip title={"Update from file"}>
                <span>
                  <IconButton onClick={() => fileInputRef.current?.click()} disabled={isUploading || !canEdit} data-testid="upload-button">
                    <FileUpload/>
                  </IconButton>
                </span>
              </Tooltip>
              <input hidden type="file" ref={fileInputRef} onChange={e => handleUpdateFromFile(e.target)}/>
              <DownloadButton snippet={snippet} version="original"/>
              <DownloadButton snippet={snippet} version="formatted"/>
              <Tooltip title={runSnippet ? "Stop run" : "Run"}>
                <IconButton onClick={() => setRunSnippet(!runSnippet)} data-testid="run-button">
                  {runSnippet ? <StopRounded/> : <PlayArrow/>}
                </IconButton>
              </Tooltip>
              {/* TODO: we can implement a live mode*/}
              <Tooltip title={"Format"}>
                <span><IconButton onClick={handleFormat} disabled={isFormatLoading} data-testid="format-button">
                  <ReadMoreIcon />
                </IconButton></span>
              </Tooltip>
              <Tooltip title={"Save changes"}>
                <span><IconButton color={"primary"} onClick={handleSave} disabled={!canEdit || isUpdateSnippetLoading || snippet?.content === code} data-testid="save-button">
                  <Save />
                </IconButton></span>
              </Tooltip>
              <Tooltip title={"Delete"}>
                <span><IconButton onClick={() => setDeleteConfirmationModalOpen(true)} disabled={!canEdit} data-testid="delete-button">
                  <Delete color={"error"} />
                </IconButton></span>
              </Tooltip>
            </Box>
            <Box display={"flex"} gap={2}>
              <Bòx flex={1} height={"fit-content"} overflow={"none"} minHeight={"500px"} bgcolor={'black'} color={'white'} code={code}>
                <Editor
                    value={code}
                    padding={10}
                    textareaId="snippet-editor"
                    onValueChange={(code) => {
                      setCode(code)
                      clearError()
                    }}
                    highlight={(code) => highlightCode(code, errorLine)}
                    maxLength={10000}
                    readOnly={!canEdit}
                    style={{
                      minHeight: "500px",
                      fontFamily: "monospace",
                      fontSize: 17,
                    }}
                />
              </Bòx>
            </Box>
            {errorMessage && <Alert severity="error" data-testid="snippet-error">{errorMessage}</Alert>}
            <Box pt={1} flex={1} marginTop={2}>
              <Alert severity="info">Output</Alert>
              {snippet && code !== snippet.content &&
                  <Alert severity="info">Run uses the saved version — save to run your changes</Alert>}
              <SnippetExecution snippetId={id} running={runSnippet} onFinished={() => setRunSnippet(false)} />
            </Box>
          </>
        }
        {snippet && <EditSnippetModal open={editModalOpened} onClose={() => setEditModalOpened(false)}
                                      snippet={snippet} content={code}
                                      onSaved={() => {
                                        queryClient.invalidateQueries(['snippet', id])
                                        queryClient.invalidateQueries(['testCases', id])
                                        queryClient.invalidateQueries('listSnippets')
                                      }}/>}
        <ShareSnippetModal loading={loadingShare || isLoading} open={shareModalOppened}
                           onClose={() => setShareModalOppened(false)}
                           onShare={handleShareSnippet}/>
        <TestSnippetModal open={testModalOpened} onClose={() => setTestModalOpened(false)}
                          snippetId={id} canEdit={canEdit}/>
        <DeleteConfirmationModal open={deleteConfirmationModalOpen} onClose={() => setDeleteConfirmationModalOpen(false)} id={snippet?.id ?? ""} setCloseDetails={handleCloseModal} />
      </Box>
  );
}

