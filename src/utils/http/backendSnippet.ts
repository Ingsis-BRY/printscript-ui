import type {CodeIssue} from "../snippet";

export type BackendPage<T> = {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
};

export type BackendCompliance = "pending" | "compliant" | "not-compliant" | "failed";
export type BackendProcessing = "pending" | "finished" | "failed";

export type BackendSnippetListItem = {
    id: string;
    name: string;
    description: string;
    language: string;
    languageVersion: string;
    owner: string;
    ownerName: string;
    valid: boolean;
    compliance: BackendCompliance;
    processing: BackendProcessing;
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
    ownerName: string;
    isOwner: boolean;
    currentVersion: BackendSnippetVersion;
    compliance: BackendCompliance;
    lintIssues: CodeIssue[];
    validationStatus: "pending" | "valid" | "invalid" | "failed";
    validationError: CodeIssue | null;
    formatStatus: "pending" | "finished" | "failed";
    processing: BackendProcessing;
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

export type BackendCreateSnippet = BackendUpdateSnippet;

export type BackendUserPage = {
    users: { id: string; name: string }[];
    page: number;
    size: number;
    total: number;
};

export type BackendLanguage = {
    language: string;
    extension: string;
    extensions: string[];
    versions: string[];
    defaultVersion: string;
};

export type BackendRule = {
    id: string;
    name: string;
    description: string;
    type: "boolean" | "integer" | "enum";
    isActive: boolean;
    value: string | number | null;
    default: string | number | boolean | null;
    options: string[] | null;
    min: number | null;
    max: number | null;
    since: string;
};

export type BackendTestCase = {
    id: string;
    snippetId: string;
    name: string;
    input: string[];
    output: string[];
    status: "pending" | "passed" | "failed" | "error";
    actualOutput: string[] | null;
    error: CodeIssue | null;
    lastRunAt: string | null;
};

export type BackendFormatResponse = {
    formatted: string;
    ignoredRules: string[];
};
