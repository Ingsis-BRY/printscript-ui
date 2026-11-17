import {Pagination} from "./pagination.ts";
import {FileType} from "../types/FileType.ts";

export type ComplianceEnum =
    'pending' |
    'failed' |
    'not-compliant' |
    'compliant'


export type CreateSnippet = {
  name: string;
  description: string;
  content: string;
  language: string;
  languageVersion: string;
  extension: string;
}

export type CreateSnippetWithLang = CreateSnippet & { language: string }

export type UpdateSnippet = {
  content: string
}

export type UpdateSnippetFull = {
  name: string;
  description: string;
  language: string;
  languageVersion: string;
  content: string;
}

export type SnippetFileData = {
  name: string;
  description: string;
  language: string;
  languageVersion: string;
  file: File;
  extension: string;
}

export type SnippetSortBy = 'name' | 'language' | 'valid'
export type SortDirection = 'asc' | 'desc'
export type SnippetDownloadVersion = 'original' | 'formatted'

export type SnippetRelationship = 'owned' | 'shared' | 'all'
export type ProcessingStatus = 'pending' | 'finished' | 'failed'

export type CodeIssue = {
  rule: string;
  message: string;
  span: { start: { line: number; column: number }; end: { line: number; column: number } } | null;
}

export type SnippetListParams = {
  page: number;
  pageSize: number;
  name?: string;
  language?: string;
  valid?: boolean;
  sortBy?: SnippetSortBy;
  direction?: SortDirection;
  relationship?: SnippetRelationship;
}

export type Snippet = CreateSnippet & {
  id: string
} & SnippetStatus

type SnippetStatus = {
  compliance: ComplianceEnum;
  /** Display name of the owner */
  author: string;
  authorId?: string;
  isOwner?: boolean;
  processing?: ProcessingStatus;
  lintIssues?: CodeIssue[];
  validationStatus?: 'pending' | 'valid' | 'invalid' | 'failed';
  validationError?: CodeIssue | null;
  formatStatus?: 'pending' | 'finished' | 'failed';
}
export type PaginatedSnippets = Pagination & {
  snippets: Snippet[]
}

export const getFileLanguage = (fileTypes: FileType[], fileExt?: string) => {
  return fileExt && fileTypes?.find(x => (x.extensions ?? [x.extension]).includes(fileExt))
}