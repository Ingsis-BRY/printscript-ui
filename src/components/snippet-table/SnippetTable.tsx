import {
  Box,
  Button,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Select,
  styled,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel
} from "@mui/material";
import {AddSnippetModal} from "./AddSnippetModal.tsx";
import {useRef, useState} from "react";
import {Add, Search} from "@mui/icons-material";
import {LoadingSnippetRow, SnippetRow} from "./SnippetRow.tsx";
import {CreateSnippetWithLang, getFileLanguage, Snippet, SnippetSortBy, SortDirection} from "../../utils/snippet.ts";
import {usePaginationContext} from "../../contexts/paginationContext.tsx";
import {useSnackbarContext} from "../../contexts/snackbarContext.tsx";
import {useGetFileTypes} from "../../utils/queries.tsx";

type SnippetTableProps = {
  handleClickSnippet: (id: string) => void;
  snippets?: Snippet[];
  loading: boolean;
  handleSearchSnippet: (snippetName: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
  sortBy: SnippetSortBy;
  direction: SortDirection;
  onSort: (field: SnippetSortBy) => void;
}

export const SnippetTable = (props: SnippetTableProps) => {
  const {snippets, handleClickSnippet, loading, handleSearchSnippet, language, onLanguageChange, sortBy, direction, onSort} = props;
  const [addModalOpened, setAddModalOpened] = useState(false);
  const [popoverMenuOpened, setPopoverMenuOpened] = useState(false)
  const [snippet, setSnippet] = useState<CreateSnippetWithLang | undefined>()
  const [snippetFile, setSnippetFile] = useState<File | undefined>()

  const popoverRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const {page, page_size: pageSize, count, handleChangePageSize, handleGoToPage} = usePaginationContext()
  const {createSnackbar} = useSnackbarContext()
  const {data: fileTypes} = useGetFileTypes();

  const handleLoadSnippet = async (target: EventTarget & HTMLInputElement) => {
    const files = target.files
    if (!files || !files.length) {
      createSnackbar('error',"Please select at leat one file")
      return
    }
    const file = files[0]
    const splitName = file.name.split(".")
    const fileType = getFileLanguage(fileTypes ?? [], splitName.at(-1))
    if (!fileType) {
      createSnackbar('error', `File type ${splitName.at(-1)} not supported`)
      return
    }
    file.text().then((text) => {
      setSnippetFile(file)
      setSnippet({
        name: splitName[0],
        content: text,
        description: "",
        languageVersion: "",
        language: fileType.language,
        extension: fileType.extension
      })
    }).catch(e => {
      console.error(e)
    }).finally(() => {
      setAddModalOpened(true)
      target.value = ""
    })
  }

  function handleClickMenu() {
    setPopoverMenuOpened(false)
  }

  return (
      <>
        <Box display="flex" flexDirection="row" justifyContent="space-between" gap={2}>
          <Box sx={{background: 'white', width: '30%', display: 'flex'}}>
            <InputBase
                sx={{ml: 1, flex: 1}}
                placeholder="Search FileType"
                inputProps={{'aria-label': 'search'}}
                onChange={e => handleSearchSnippet(e.target.value)}
            />
            <IconButton type="button" sx={{p: '10px'}} aria-label="search">
              <Search/>
            </IconButton>
          </Box>
          <Select size="small" displayEmpty sx={{background: 'white', minWidth: 160}}
                  value={language} onChange={e => onLanguageChange(e.target.value)}
                  inputProps={{'aria-label': 'language filter'}}>
            <MenuItem value="">All languages</MenuItem>
            {fileTypes?.map(x => <MenuItem key={x.language} value={x.language}>{x.language}</MenuItem>)}
          </Select>
          <Button ref={popoverRef} variant="contained" disableRipple sx={{boxShadow: 0}}
                  onClick={() => setPopoverMenuOpened(true)}>
            <Add/>
            Add Snippet
          </Button>
        </Box>
        <Table size="medium" sx={{borderSpacing: "0 10px", borderCollapse: "separate"}}>
          <TableHead>
            <TableRow sx={{fontWeight: 'bold'}}>
              <StyledTableCell sx={{fontWeight: "bold"}}>
                <TableSortLabel active={sortBy === 'name'} direction={direction} onClick={() => onSort('name')}>Name</TableSortLabel>
              </StyledTableCell>
              <StyledTableCell sx={{fontWeight: "bold"}}>
                <TableSortLabel active={sortBy === 'language'} direction={direction} onClick={() => onSort('language')}>Language</TableSortLabel>
              </StyledTableCell>
              <StyledTableCell sx={{fontWeight: "bold"}}>Author</StyledTableCell>
              <StyledTableCell sx={{fontWeight: "bold"}}>
                <TableSortLabel active={sortBy === 'valid'} direction={direction} onClick={() => onSort('valid')}>Conformance</TableSortLabel>
              </StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>{
            loading ? (
                <>
                  {Array.from({length: 10}).map((_, index) => (
                      <LoadingSnippetRow key={index}/>
                  ))}
                </>
            ) : (
                <>
                  {
                      snippets && snippets.map((snippet) => (
                          <SnippetRow data-testid={"snippet-row"}
                                      onClick={() => handleClickSnippet(snippet.id)} key={snippet.id} snippet={snippet}/>
                      ))
                  }
                </>
            )
          }
          </TableBody>
          <TablePagination count={count} page={page} rowsPerPage={pageSize}
                           onPageChange={(_, page) => handleGoToPage(page)}
                           onRowsPerPageChange={e => handleChangePageSize(Number(e.target.value))}/>
        </Table>
        <AddSnippetModal defaultSnippet={snippet} file={snippetFile} open={addModalOpened}
                         onClose={() => {
                           setAddModalOpened(false)
                           setSnippet(undefined)
                           setSnippetFile(undefined)
                         }}/>
        <Menu anchorEl={popoverRef.current} open={popoverMenuOpened} onClick={handleClickMenu}>
          <MenuItem onClick={() => {
            setSnippet(undefined)
            setSnippetFile(undefined)
            setAddModalOpened(true)
          }}>Create snippet</MenuItem>
          <MenuItem onClick={() => inputRef?.current?.click()}>Load snippet from file</MenuItem>
        </Menu>
        <input hidden type={"file"} ref={inputRef} multiple={false} data-testid={"upload-file-input"}
               onChange={e => handleLoadSnippet(e?.target)}/>
      </>
  )
}


export const StyledTableCell = styled(TableCell)`
    border: 0;
    align-items: center;
`
