export type BackendPage<T> = {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
};

export type BackendSnippetListItem = {
    id: string;
    name: string;
    description: string;
    language: string;
    languageVersion: string;
    owner: string;
    valid: boolean;
};

export type BackendSnippetVersion = {
    id: string;
    snippetId: string;
    versionNumber: number;
    originalContent: string;
    formattedContent: string | null;
    createdAt: string;
};

export type BackendGetSnippet = {
    id: string;
    name: string;
    description: string;
    language: string;
    languageVersion: string;
    owner: string;
    currentVersion: BackendSnippetVersion;
};

export type BackendUpdateSnippet = {
    id: string;
    name: string;
    description: string;
    language: string;
    languageVersion: string;
    owner: string;
    versionNumber: number;
    content: string;
};

export type BackendCreateSnippet = {
    id: string;
};