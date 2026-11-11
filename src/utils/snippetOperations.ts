import {
  CreateSnippet,
  PaginatedSnippets,
  Snippet,
  SnippetDownloadVersion,
  SnippetFileData,
  SnippetListParams,
  UpdateSnippet,
  UpdateSnippetFull
} from './snippet'
import {PaginatedUsers} from "./users.ts";
import {TestCase} from "../types/TestCase.ts";
import {TestCaseResult} from "./queries.tsx";
import {FileType} from "../types/FileType.ts";
import {Rule} from "../types/Rule.ts";

export interface SnippetOperations {
  listSnippetDescriptors(params: SnippetListParams): Promise<PaginatedSnippets>

  createSnippet(createSnippet: CreateSnippet): Promise<Snippet>

  getSnippetById(id: string): Promise<Snippet | undefined>

  updateSnippetById(id: string, updateSnippet: UpdateSnippet): Promise<Snippet>

  updateSnippetFull(id: string, updateSnippet: UpdateSnippetFull): Promise<Snippet>

  createSnippetFromFile(data: SnippetFileData): Promise<Snippet>

  updateSnippetFromFile(id: string, data: SnippetFileData): Promise<Snippet>

  downloadSnippet(id: string, version: SnippetDownloadVersion): Promise<Blob>

  getUserFriends(name?: string,page?: number,pageSize?: number): Promise<PaginatedUsers>

  shareSnippet(snippetId: string,userId: string): Promise<Snippet>

  getFormatRules(): Promise<Rule[]>

  getLintingRules(): Promise<Rule[]>

  getTestCases(): Promise<TestCase[]>

  formatSnippet(snippet: string): Promise<string>

  postTestCase(testCase: Partial<TestCase>): Promise<TestCase>

  removeTestCase(id: string): Promise<string>

  deleteSnippet(id: string): Promise<string>

  testSnippet(testCase: Partial<TestCase>): Promise<TestCaseResult>

  getFileTypes(): Promise<FileType[]>

  modifyFormatRule(newRules: Rule[]): Promise<Rule[]>

  modifyLintingRule(newRules: Rule[]): Promise<Rule[]>
}
