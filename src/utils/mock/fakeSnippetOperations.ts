import {SnippetOperations} from '../snippetOperations'
import {FakeSnippetStore} from './fakeSnippetStore'
import {
  CreateSnippet,
  PaginatedSnippets,
  Snippet,
  SnippetFileData,
  SnippetListParams,
  UpdateSnippet,
  UpdateSnippetFull
} from '../snippet'
import autoBind from 'auto-bind'
import {PaginatedUsers} from "../users.ts";
import {TestCase} from "../../types/TestCase.ts";
import {TestCaseResult} from "../queries.tsx";
import {FileType} from "../../types/FileType.ts";
import {Rule} from "../../types/Rule.ts";

const DELAY: number = 1000

export class FakeSnippetOperations implements SnippetOperations {
  private readonly fakeStore = new FakeSnippetStore()

  constructor() {
    autoBind(this)
  }

  createSnippet(createSnippet: CreateSnippet): Promise<Snippet> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.createSnippet(createSnippet)), DELAY)
    })
  }

  getSnippetById(id: string): Promise<Snippet | undefined> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.getSnippetById(id)), DELAY)
    })
  }

  listSnippetDescriptors({page, pageSize}: SnippetListParams): Promise<PaginatedSnippets> {
    const response: PaginatedSnippets = {
      page: page,
      page_size: pageSize,
      count: 20,
      snippets: page == 0 ? this.fakeStore.listSnippetDescriptors().splice(0,pageSize) : this.fakeStore.listSnippetDescriptors().splice(1,2)
    }

    return new Promise(resolve => {
      setTimeout(() => resolve(response), DELAY)
    })
  }

  updateSnippetById(id: string, updateSnippet: UpdateSnippet): Promise<Snippet> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.updateSnippet(id, updateSnippet)), DELAY)
    })
  }

  updateSnippetFull(id: string, updateSnippet: UpdateSnippetFull): Promise<Snippet> {
    return this.updateSnippetById(id, {content: updateSnippet.content})
  }

  createSnippetFromFile(data: SnippetFileData): Promise<Snippet> {
    return data.file.text().then(content => this.createSnippet({
      name: data.name,
      description: data.description,
      language: data.language,
      languageVersion: data.languageVersion,
      extension: data.extension,
      content
    }))
  }

  updateSnippetFromFile(id: string, data: SnippetFileData): Promise<Snippet> {
    return data.file.text().then(content => this.updateSnippetById(id, {content}))
  }

  downloadSnippet(id: string): Promise<Blob> {
    return this.getSnippetById(id).then(snippet => new Blob([snippet?.content ?? ''], {type: 'text/plain'}))
  }

  getUserFriends(name: string = "", page: number = 1, pageSize: number = 10): Promise<PaginatedUsers> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.getUserFriends(name,page,pageSize)), DELAY)
    })
  }

  shareSnippet(snippetId: string): Promise<Snippet> {
    return new Promise(resolve => {
      // @ts-expect-error, it will always find it in the fake store
      setTimeout(() => resolve(this.fakeStore.getSnippetById(snippetId)), DELAY)
    })
  }

  getFormatRules(): Promise<Rule[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.getFormatRules()), DELAY)
    })
  }

  getLintingRules(): Promise<Rule[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.getLintingRules()), DELAY)
    })
  }

  formatSnippet(snippetContent: string): Promise<string> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.formatSnippet(snippetContent)), DELAY)
    })
  }

  getTestCases(): Promise<TestCase[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.getTestCases()), DELAY)
    })
  }

  postTestCase(testCase: TestCase): Promise<TestCase> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.postTestCase(testCase)), DELAY)
    })
  }

  removeTestCase(id: string): Promise<string> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.removeTestCase(id)), DELAY)
    })
  }

  testSnippet(): Promise<TestCaseResult> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.testSnippet()), DELAY)
    })
  }

  deleteSnippet(id: string): Promise<string> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.deleteSnippet(id)), DELAY)
    })
  }

  getFileTypes(): Promise<FileType[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.getFileTypes()), DELAY)
    })
  }

  modifyFormatRule(newRules: Rule[]): Promise<Rule[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.modifyFormattingRule(newRules)), DELAY)
    })
  }

  modifyLintingRule(newRules: Rule[]): Promise<Rule[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.fakeStore.modifyLintingRule(newRules)), DELAY)
    })
  }
}
