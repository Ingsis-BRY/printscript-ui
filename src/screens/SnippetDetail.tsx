import {useEffect, useRef, useState} from "react";
import Editor from "react-simple-code-editor";
import {highlight, languages} from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-okaidia.css";
import {Alert, Box, CircularProgress, IconButton, Tooltip, Typography} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import {
  useDownloadSnippet,
  useGetFileTypes,
  useUpdateSnippetById,
  useUpdateSnippetFromFile
} from "../utils/queries.tsx";
import {useFormatSnippet, useGetSnippetById, useShareSnippet} from "../utils/queries.tsx";
import {Bòx} from "../components/snippet-table/SnippetBox.tsx";
import {BugReport, Delete, Download, Edit, FileUpload, Save, Share} from "@mui/icons-material";
import {ShareSnippetModal} from "../components/snippet-detail/ShareSnippetModal.tsx";
import {TestSnippetModal} from "../components/snippet-test/TestSnippetModal.tsx";
import {Snippet, SnippetDownloadVersion} from "../utils/snippet.ts";
import {useSnackbarContext} from "../contexts/snackbarContext.tsx";
import {EditSnippetModal} from "../components/snippet-detail/EditSnippetModal.tsx";
import {SnippetExecution} from "./SnippetExecution.tsx";
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import {queryClient} from "../App.tsx";
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
        <IconButton onClick={handleDownload} disabled={isLoading} sx={{cursor: "pointer"}}>
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {createSnackbar} = useSnackbarContext()

  const {data: snippet, isLoading} = useGetSnippetById(id);
  const {mutate: shareSnippet, isLoading: loadingShare} = useShareSnippet()
  const {mutate: formatSnippet, isLoading: isFormatLoading, data: formatSnippetData} = useFormatSnippet()
  const {mutate: updateSnippet, isLoading: isUpdateSnippetLoading} = useUpdateSnippetById({onSuccess: () => queryClient.invalidateQueries(['snippet', id])})

  const {mutate: updateFromFile, isLoading: isUploading} = useUpdateSnippetFromFile({
    onSuccess: () => {
      queryClient.invalidateQueries(['snippet', id])
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
    }, {onError: (e) => createSnackbar('error', e.message)})
  }

  useEffect(() => {
    if (snippet) {
      setCode(snippet.content);
    }
  }, [snippet]);

  useEffect(() => {
    if (formatSnippetData) {
      setCode(formatSnippetData)
    }
  }, [formatSnippetData])


  async function handleShareSnippet(userId: string) {
    shareSnippet({snippetId: id, userId})
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
            <Box display="flex" flexDirection="row" gap="8px" padding="8px">
              <Tooltip title={"Share"}>
                <IconButton onClick={() => setShareModalOppened(true)}>
                  <Share/>
                </IconButton>
              </Tooltip>
              <Tooltip title={"Test"}>
                <IconButton onClick={() => setTestModalOpened(true)}>
                  <BugReport/>
                </IconButton>
              </Tooltip>
              <Tooltip title={"Edit details"}>
                <IconButton onClick={() => setEditModalOpened(true)}>
                  <Edit/>
                </IconButton>
              </Tooltip>
              <Tooltip title={"Update from file"}>
                <span>
                  <IconButton onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    <FileUpload/>
                  </IconButton>
                </span>
              </Tooltip>
              <input hidden type="file" ref={fileInputRef} onChange={e => handleUpdateFromFile(e.target)}/>
              <DownloadButton snippet={snippet} version="original"/>
              <DownloadButton snippet={snippet} version="formatted"/>
              {/*<Tooltip title={runSnippet ? "Stop run" : "Run"}>*/}
              {/*  <IconButton onClick={() => setRunSnippet(!runSnippet)}>*/}
              {/*    {runSnippet ? <StopRounded/> : <PlayArrow/>}*/}
              {/*  </IconButton>*/}
              {/*</Tooltip>*/}
              {/* TODO: we can implement a live mode*/}
              <Tooltip title={"Format"}>
                <IconButton onClick={() => formatSnippet(code)} disabled={isFormatLoading}>
                  <ReadMoreIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={"Save changes"}>
                <IconButton color={"primary"} onClick={() => updateSnippet({id: id, updateSnippet: {content: code}}, {onError: (e) => createSnackbar('error', e.message)})} disabled={isUpdateSnippetLoading || snippet?.content === code} >
                  <Save />
                </IconButton>
              </Tooltip>
              <Tooltip title={"Delete"}>
                <IconButton onClick={() => setDeleteConfirmationModalOpen(true)} >
                  <Delete color={"error"} />
                </IconButton>
              </Tooltip>
            </Box>
            <Box display={"flex"} gap={2}>
              <Bòx flex={1} height={"fit-content"} overflow={"none"} minHeight={"500px"} bgcolor={'black'} color={'white'} code={code}>
                <Editor
                    value={code}
                    padding={10}
                    onValueChange={(code) => setCode(code)}
                    highlight={(code) => highlight(code, languages.js, "javascript")}
                    maxLength={1000}
                    style={{
                      minHeight: "500px",
                      fontFamily: "monospace",
                      fontSize: 17,
                    }}
                />
              </Bòx>
            </Box>
            <Box pt={1} flex={1} marginTop={2}>
              <Alert severity="info">Output</Alert>
              <SnippetExecution />
            </Box>
          </>
        }
        {snippet && <EditSnippetModal open={editModalOpened} onClose={() => setEditModalOpened(false)}
                                      snippet={snippet} content={code}
                                      onSaved={() => {
                                        queryClient.invalidateQueries(['snippet', id])
                                        queryClient.invalidateQueries('listSnippets')
                                      }}/>}
        <ShareSnippetModal loading={loadingShare || isLoading} open={shareModalOppened}
                           onClose={() => setShareModalOppened(false)}
                           onShare={handleShareSnippet}/>
        <TestSnippetModal open={testModalOpened} onClose={() => setTestModalOpened(false)}/>
        <DeleteConfirmationModal open={deleteConfirmationModalOpen} onClose={() => setDeleteConfirmationModalOpen(false)} id={snippet?.id ?? ""} setCloseDetails={handleCloseModal} />
      </Box>
  );
}

