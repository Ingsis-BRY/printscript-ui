import {useMemo} from 'react';
import {useMutation, UseMutationResult, useQuery} from 'react-query';
import {
  CreateSnippet,
  PaginatedSnippets,
  Snippet,
  SnippetDownloadVersion,
  SnippetFileData,
  SnippetListParams,
  UpdateSnippet,
  UpdateSnippetFull
} from './snippet.ts';
import {SnippetOperations} from "./snippetOperations.ts";
import {PaginatedUsers} from "./users.ts";
import {createHybridSnippetOperations} from "./http/hybridSnippetOperations.ts";
import {TestCase} from "../types/TestCase.ts";
import {FileType} from "../types/FileType.ts";
import {Rule} from "../types/Rule.ts";
// import {useAuth0} from "@auth0/auth0-react";
// import {useEffect} from "react";


export const useSnippetsOperations = () => {
  // const {getAccessTokenSilently} = useAuth0()
  //
  // useEffect(() => {
  //     getAccessTokenSilently()
  //         .then(token => {
  //             console.log(token)
  //         })
  //         .catch(error => console.error(error));
  // });

  // Snippet-service endpoints use the real backend; the rest is still mocked.
  return useMemo<SnippetOperations>(() => createHybridSnippetOperations(), [])
}

export const useGetSnippets = (params: SnippetListParams) => {
  const snippetOperations = useSnippetsOperations()

  return useQuery<PaginatedSnippets, Error>(['listSnippets', params], () => snippetOperations.listSnippetDescriptors(params), {keepPreviousData: true});
};

export const useGetSnippetById = (id: string) => {
  const snippetOperations = useSnippetsOperations()

  return useQuery<Snippet | undefined, Error>(['snippet', id], () => snippetOperations.getSnippetById(id), {
    enabled: !!id, // This query will not execute until the id is provided
  });
};

export const useCreateSnippet = ({onSuccess}: {onSuccess: () => void}): UseMutationResult<Snippet, Error, CreateSnippet> => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<Snippet, Error, CreateSnippet>(createSnippet => snippetOperations.createSnippet(createSnippet), {onSuccess});
};

export const useUpdateSnippetById = ({onSuccess}: {onSuccess: () => void}): UseMutationResult<Snippet, Error, {
  id: string;
  updateSnippet: UpdateSnippet
}> => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<Snippet, Error, { id: string; updateSnippet: UpdateSnippet }>(
      ({id, updateSnippet}) => snippetOperations.updateSnippetById(id, updateSnippet),{
        onSuccess,
    }
  );
};

export const useUpdateSnippetFull = ({onSuccess}: {onSuccess: () => void}) => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<Snippet, Error, { id: string; updateSnippet: UpdateSnippetFull }>(
      ({id, updateSnippet}) => snippetOperations.updateSnippetFull(id, updateSnippet),
      {onSuccess}
  );
};

export const useCreateSnippetFromFile = ({onSuccess}: {onSuccess: () => void}) => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<Snippet, Error, SnippetFileData>(
      data => snippetOperations.createSnippetFromFile(data),
      {onSuccess}
  );
};

export const useUpdateSnippetFromFile = ({onSuccess}: {onSuccess: () => void}) => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<Snippet, Error, { id: string; data: SnippetFileData }>(
      ({id, data}) => snippetOperations.updateSnippetFromFile(id, data),
      {onSuccess}
  );
};

export const useDownloadSnippet = () => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<Blob, Error, { id: string; version: SnippetDownloadVersion }>(
      ({id, version}) => snippetOperations.downloadSnippet(id, version)
  );
};

export const useGetUsers = (name: string = "", page: number = 0, pageSize: number = 10) => {
  const snippetOperations = useSnippetsOperations()

  return useQuery<PaginatedUsers, Error>(['users',name,page,pageSize], () => snippetOperations.getUserFriends(name,page, pageSize));
};

export const useShareSnippet = () => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<Snippet, Error, { snippetId: string; userId: string }>(
      ({snippetId, userId}) => snippetOperations.shareSnippet(snippetId, userId)
  );
};


export const useGetTestCases = () => {
  const snippetOperations = useSnippetsOperations()

  return useQuery<TestCase[] | undefined, Error>(['testCases'], () => snippetOperations.getTestCases(), {});
};


export const usePostTestCase = () => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<TestCase, Error, Partial<TestCase>>(
      (tc) => snippetOperations.postTestCase(tc)
  );
};


export const useRemoveTestCase = ({onSuccess}: {onSuccess: () => void}) => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<string, Error, string>(
      ['removeTestCase'],
      (id) => snippetOperations.removeTestCase(id),
      {
        onSuccess,
      }
  );
};

export type TestCaseResult = "success" | "fail"

export const useTestSnippet = () => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<TestCaseResult, Error, Partial<TestCase>>(
      (tc) => snippetOperations.testSnippet(tc)
  )
}



export const useGetFormatRules = () => {
  const snippetOperations = useSnippetsOperations()

  return useQuery<Rule[], Error>('formatRules', () => snippetOperations.getFormatRules());
}

export const useModifyFormatRules = ({onSuccess}: {onSuccess: () => void}) => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<Rule[], Error, Rule[]>(
      rule => snippetOperations.modifyFormatRule(rule),
      {onSuccess}
  );
}


export const useGetLintingRules = () => {
  const snippetOperations = useSnippetsOperations()

  return useQuery<Rule[], Error>('lintingRules', () => snippetOperations.getLintingRules());
}


export const useModifyLintingRules = ({onSuccess}: {onSuccess: () => void}) => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<Rule[], Error, Rule[]>(
      rule => snippetOperations.modifyLintingRule(rule),
      {onSuccess}
  );
}

export const useFormatSnippet = () => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<string, Error, string>(
      snippetContent => snippetOperations.formatSnippet(snippetContent)
  );
}

export const useDeleteSnippet = ({onSuccess}: {onSuccess: () => void}) => {
  const snippetOperations = useSnippetsOperations()

  return useMutation<string, Error, string>(
      id => snippetOperations.deleteSnippet(id),
      {
        onSuccess,
      }
  );
}


export const useGetFileTypes = () => {
  const snippetOperations = useSnippetsOperations()

  return useQuery<FileType[], Error>('fileTypes', () => snippetOperations.getFileTypes());
}