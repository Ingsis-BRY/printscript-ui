import {
    BackendCreateSnippet,
    BackendGetSnippet,
    BackendLanguage,
    BackendPage,
    BackendRule,
    BackendSnippetListItem,
    BackendTestCase,
    BackendUpdateSnippet,
} from "./backendSnippet";

import {PaginatedSnippets, Snippet} from "../snippet";
import {FileType} from "../../types/FileType";
import {Rule} from "../../types/Rule";
import {TestCase} from "../../types/TestCase";

export const mapCreateSnippet = (
    snippet: BackendCreateSnippet,
    extension: string
): Snippet => ({
    id: snippet.id,
    name: snippet.name,
    description: snippet.description,
    content: snippet.content,
    language: snippet.language,
    languageVersion: snippet.languageVersion,
    extension,
    author: snippet.owner,
    authorId: snippet.owner,
    compliance: "pending",
});

export const mapSnippetListItem = (
    snippet: BackendSnippetListItem
): Snippet => ({
    id: snippet.id,
    name: snippet.name,
    description: snippet.description,
    content: "",
    language: snippet.language,
    languageVersion: snippet.languageVersion,
    extension: "",
    author: snippet.ownerName || snippet.owner,
    authorId: snippet.owner,
    compliance: snippet.compliance,
    processing: snippet.processing,
});

export const mapGetSnippet = (
    snippet: BackendGetSnippet
): Snippet => ({
    id: snippet.id,
    name: snippet.name,
    description: snippet.description,
    content: snippet.currentVersion.originalContent,
    language: snippet.language,
    languageVersion: snippet.languageVersion,
    extension: "",
    author: snippet.ownerName || snippet.owner,
    authorId: snippet.owner,
    isOwner: snippet.isOwner,
    compliance: snippet.compliance,
    processing: snippet.processing,
    lintIssues: snippet.lintIssues ?? [],
    validationStatus: snippet.validationStatus,
    validationError: snippet.validationError,
    formatStatus: snippet.formatStatus,
});

export const mapUpdateSnippet = (
    snippet: BackendUpdateSnippet
): Snippet => ({
    id: snippet.id,
    name: snippet.name,
    description: snippet.description,
    content: snippet.content,
    language: snippet.language,
    languageVersion: snippet.languageVersion,
    extension: "",
    author: snippet.owner,
    authorId: snippet.owner,
    compliance: "pending",
});

export const mapPaginatedSnippets = (
    response: BackendPage<BackendSnippetListItem>
): PaginatedSnippets => ({
    page: response.page,
    page_size: response.size,
    count: response.totalElements,
    snippets: response.content.map(mapSnippetListItem),
});

export const mapLanguage = (language: BackendLanguage): FileType => ({
    language: language.language,
    extension: language.extension,
    extensions: language.extensions,
    versions: language.versions,
    defaultVersion: language.defaultVersion,
});

export const mapRule = (rule: BackendRule): Rule => ({...rule});

export const mapTestCase = (test: BackendTestCase): TestCase => ({
    id: test.id,
    name: test.name,
    input: test.input,
    output: test.output,
    status: test.status,
    actualOutput: test.actualOutput,
    error: test.error,
    lastRunAt: test.lastRunAt,
});
