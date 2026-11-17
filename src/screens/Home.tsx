import {withNavbar} from "../components/navbar/withNavbar.tsx";
import {SnippetTable} from "../components/snippet-table/SnippetTable.tsx";
import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {SnippetDetail} from "./SnippetDetail.tsx";
import {Drawer} from "@mui/material";
import {useGetSnippets} from "../utils/queries.tsx";
import {SnippetRelationship, SnippetSortBy, SortDirection} from "../utils/snippet.ts";
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
  const [relationship, setRelationship] = useState<SnippetRelationship>('all');
  const [validity, setValidity] = useState<'' | 'true' | 'false'>('');
  const {page, page_size, count, handleChangeCount, handleGoToPage} = usePaginationContext()
  const {data, isLoading} = useGetSnippets({
    page,
    pageSize: page_size,
    name: snippetName,
    language: language || undefined,
    sortBy,
    direction,
    relationship,
    valid: validity === '' ? undefined : validity === 'true'
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

  const handleRelationship = (value: SnippetRelationship) => {
    setRelationship(value)
    handleGoToPage(0)
  }

  const handleValidity = (value: '' | 'true' | 'false') => {
    setValidity(value)
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
                      sortBy={sortBy} direction={direction} onSort={handleSort}
                      relationship={relationship} onRelationshipChange={handleRelationship}
                      validity={validity} onValidityChange={handleValidity}/>
        <Drawer open={!!snippetId} anchor={"right"} onClose={handleCloseModal}>
          {snippetId && <SnippetDetail handleCloseModal={handleCloseModal} id={snippetId}/>}
        </Drawer>
      </>
  )
}

export default withNavbar(HomeScreen);

