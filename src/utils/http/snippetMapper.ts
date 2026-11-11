import {
    BackendGetSnippet,
    BackendPage,
    BackendSnippetListItem,
    BackendUpdateSnippet,
} from "./backendSnippet";

import { Snippet, PaginatedSnippets } from "../snippet";

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
    author: snippet.owner,
    compliance: "pending",
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
    author: snippet.owner,
    compliance: "pending",
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