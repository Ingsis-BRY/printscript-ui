import {withNavbar} from "../components/navbar/withNavbar.tsx";
import {SnippetTable} from "../components/snippet-table/SnippetTable.tsx";
import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {SnippetDetail} from "./SnippetDetail.tsx";
import {Drawer} from "@mui/material";
import {useGetSnippets} from "../utils/queries.tsx";
import {SnippetSortBy, SortDirection} from "../utils/snippet.ts";
import {usePaginationContext} from "../contexts/paginationContext.tsx";
import useDebounce from "../hooks/useDebounce.ts";

const HomeScreen = () => {
  const {id: paramsId} = useParams<{ id: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [snippetName, setSnippetName] = useState('');
  const [snippetId, setSnippetId] = useState<string | null>(null)
  const [language, setLanguage] = useState('');
  const [sortBy, setSortBy] = useState<SnippetSortBy>('name');
  const [direction, setDirection] = useState<SortDirection>('asc');
  const {page, page_size, count, handleChangeCount, handleGoToPage} = usePaginationContext()
  const {data, isLoading} = useGetSnippets({
    page,
    pageSize: page_size,
    name: snippetName,
    language: language || undefined,
    sortBy,
    direction
  })

  useEffect(() => {
    if (data?.count && data.count != count) {
      handleChangeCount(data.count)
    }
  }, [count, data?.count, handleChangeCount]);


  useEffect(() => {
    if (paramsId) {
      setSnippetId(paramsId);
    }
  }, [paramsId]);

  const handleCloseModal = () => setSnippetId(null)

  // DeBounce Function
  useDebounce(() => {
        setSnippetName(
            searchTerm
        );
      }, [searchTerm], 800
  );

  const handleSearchSnippet = (snippetName: string) => {
    setSearchTerm(snippetName);
  };

  const handleSort = (field: SnippetSortBy) => {
    if (field === sortBy) {
      setDirection(direction === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setDirection('asc')
    }
    handleGoToPage(0)
  }

  const handleLanguageFilter = (value: string) => {
    setLanguage(value)
    handleGoToPage(0)
  }


  return (
      <>
        <SnippetTable loading={isLoading} handleClickSnippet={setSnippetId} snippets={data?.snippets}
                      handleSearchSnippet={handleSearchSnippet}
                      language={language} onLanguageChange={handleLanguageFilter}
                      sortBy={sortBy} direction={direction} onSort={handleSort}/>
        <Drawer open={!!snippetId} anchor={"right"} onClose={handleCloseModal}>
          {snippetId && <SnippetDetail handleCloseModal={handleCloseModal} id={snippetId}/>}
        </Drawer>
      </>
  )
}

export default withNavbar(HomeScreen);

