import { httpClient } from "./httpClient";

import {
    BackendCreateSnippet,
    BackendFormatResponse,
    BackendGetSnippet,
    BackendLanguage,
    BackendPage,
    BackendRule,
    BackendSnippetListItem,
    BackendTestCase,
    BackendUpdateSnippet,
    BackendUserPage,
} from "./backendSnippet";

import {
    mapCreateSnippet,
    mapGetSnippet,
    mapLanguage,
    mapPaginatedSnippets,
    mapRule,
    mapTestCase,
    mapUpdateSnippet,
} from "./snippetMapper";

import {
    CreateSnippet,
    Snippet,
    PaginatedSnippets,
    SnippetDownloadVersion,
    SnippetFileData,
    SnippetListParams,
    UpdateSnippet,
    UpdateSnippetFull,
} from "../snippet";
import {PaginatedUsers} from "../users";
import {SnippetOperations} from "../snippetOperations";
import type {TestRunResult} from "../queries";
import {FileType} from "../../types/FileType";
import {Rule} from "../../types/Rule";
import {TestCase} from "../../types/TestCase";
import {openSnippetRun, RunServerMessage} from "./snippetRunSocket";

const toFormData = (data: SnippetFileData): FormData => {
    const form = new FormData();
    form.append("name", data.name);
    form.append("description", data.description);
    form.append("language", data.language);
    form.append("languageVersion", data.languageVersion);
    form.append("file", data.file);
    return form;
};

const toRuleUpdates = (rules: Rule[]) =>
    rules.map(r => ({id: r.id, isActive: r.isActive, value: r.value ?? null}));

export class HttpSnippetOperations implements SnippetOperations {

    async createSnippetFromFile(data: SnippetFileData): Promise<Snippet> {
        const response = await httpClient.post<BackendCreateSnippet>(
            "/snippets/upload",
            toFormData(data)
        );

        return mapCreateSnippet(response.data, data.extension);
    }

    async updateSnippetFromFile(id: string, data: SnippetFileData): Promise<Snippet> {
        const response = await httpClient.put<BackendUpdateSnippet>(
            `/snippets/${id}/upload`,
            toFormData(data)
        );

        return mapUpdateSnippet(response.data);
    }

    async updateSnippetFull(id: string, updateSnippet: UpdateSnippetFull): Promise<Snippet> {
        const response = await httpClient.put<BackendUpdateSnippet>(
            `/snippets/${id}`,
            updateSnippet
        );

        return mapUpdateSnippet(response.data);
    }

    async downloadSnippet(id: string, version: SnippetDownloadVersion): Promise<Blob> {
        const response = await httpClient.get<Blob>(`/snippets/${id}/download`, {
            params: {version},
            responseType: "blob",
        });

        return response.data;
    }

    async createSnippet(createSnippet: CreateSnippet): Promise<Snippet> {

        const response = await httpClient.post<BackendCreateSnippet>(
            "/snippets",
            {
                name: createSnippet.name,
                description: createSnippet.description,
                language: createSnippet.language,
                languageVersion: createSnippet.languageVersion,
                content: createSnippet.content,
            }
        );

        return mapCreateSnippet(response.data, createSnippet.extension);
    }

    async listSnippetDescriptors({
        page,
        pageSize,
        name,
        language,
        valid,
        sortBy,
        direction,
        relationship,
    }: SnippetListParams): Promise<PaginatedSnippets> {

        const response = await httpClient.get<
            BackendPage<BackendSnippetListItem>
        >("/snippets", {
            params: {
                page,
                size: pageSize,
                name: name || undefined,
                language: language || undefined,
                valid,
                sortBy,
                direction,
                relationship: relationship || undefined,
            },
        });

        return mapPaginatedSnippets(response.data);
    }

    async getSnippetById(id: string): Promise<Snippet | undefined> {

        const response = await httpClient.get<BackendGetSnippet>(
            `/snippets/${id}`
        );

        return mapGetSnippet(response.data);
    }

    async updateSnippetById(
        id: string,
        updateSnippet: UpdateSnippet
    ): Promise<Snippet> {

        const response = await httpClient.patch<BackendUpdateSnippet>(
            `/snippets/${id}`,
            updateSnippet
        );

        return mapUpdateSnippet(response.data);
    }

    async getUserFriends(name: string = "", page: number = 1, pageSize: number = 10): Promise<PaginatedUsers> {

        const response = await httpClient.get<BackendUserPage>("/users", {
            params: {name, page: Math.max(page - 1, 0), size: pageSize},
        });

        return {
            page,
            page_size: response.data.size,
            count: response.data.total,
            users: response.data.users,
        };
    }

    async shareSnippet(snippetId: string, userId: string): Promise<Snippet> {

        await httpClient.post(`/snippets/${snippetId}/share`, {targetUserId: userId});

        const snippet = await this.getSnippetById(snippetId);
        if (!snippet) {
            throw new Error(`Snippet ${snippetId} not found`);
        }
        return snippet;
    }

    async deleteSnippet(id: string): Promise<string> {

        await httpClient.delete(`/snippets/${id}`);

        return id;
    }

    async getFormatRules(): Promise<Rule[]> {
        const response = await httpClient.get<BackendRule[]>("/rules/format");
        return response.data.map(mapRule);
    }

    async getLintingRules(): Promise<Rule[]> {
        const response = await httpClient.get<BackendRule[]>("/rules/lint");
        return response.data.map(mapRule);
    }

    async modifyFormatRule(newRules: Rule[]): Promise<Rule[]> {
        const response = await httpClient.put<BackendRule[]>("/rules/format", toRuleUpdates(newRules));
        return response.data.map(mapRule);
    }

    async modifyLintingRule(newRules: Rule[]): Promise<Rule[]> {
        const response = await httpClient.put<BackendRule[]>("/rules/lint", toRuleUpdates(newRules));
        return response.data.map(mapRule);
    }

    async getTestCases(snippetId: string): Promise<TestCase[]> {
        const response = await httpClient.get<BackendTestCase[]>(`/snippets/${snippetId}/tests`);
        return response.data.map(mapTestCase);
    }

    async postTestCase(snippetId: string, testCase: Partial<TestCase>): Promise<TestCase> {
        const body = {name: testCase.name, input: testCase.input ?? [], output: testCase.output ?? []};
        const response = testCase.id
            ? await httpClient.put<BackendTestCase>(`/snippets/${snippetId}/tests/${testCase.id}`, body)
            : await httpClient.post<BackendTestCase>(`/snippets/${snippetId}/tests`, body);
        return mapTestCase(response.data);
    }

    async removeTestCase(snippetId: string, testId: string): Promise<string> {
        await httpClient.delete(`/snippets/${snippetId}/tests/${testId}`);
        return testId;
    }

    async formatSnippet(snippetId: string, content: string): Promise<string> {
        const response = await httpClient.post<BackendFormatResponse>(`/snippets/${snippetId}/format`, {content});
        return response.data.formatted;
    }

    async getFileTypes(): Promise<FileType[]> {
        const response = await httpClient.get<BackendLanguage[]>("/languages");
        return response.data.map(mapLanguage);
    }

    testSnippet(snippetId: string, testId: string, onOutput?: (line: string) => void): Promise<TestRunResult> {
        return new Promise<TestRunResult>((resolve, reject) => {
            let settled = false;
            let connection: { close(): void } | undefined;
            const settle = (action: () => void) => {
                if (settled) return;
                settled = true;
                connection?.close();
                action();
            };
            const onMessage = (message: RunServerMessage) => {
                switch (message.type) {
                    case "output":
                        onOutput?.(message.line);
                        break;
                    case "done":
                        settle(() => resolve({
                            result: message.passed === true && !message.error ? "success" : "fail",
                            outputs: message.outputs,
                            error: message.error,
                        }));
                        break;
                    case "rejected":
                    case "error":
                        settle(() => reject(new Error(message.detail)));
                        break;
                }
            };
            openSnippetRun(snippetId, {
                onMessage,
                onClose: (_event, opened) => settle(() => reject(new Error(
                    opened ? "Connection lost" : "Could not connect (session expired or no access)"))),
            }, {type: "start", mode: "test", testId}).then(conn => {
                connection = conn;
                if (settled) conn.close();
            }).catch(e => settle(() => reject(e instanceof Error ? e : new Error("Could not connect"))));
        });
    }
}
