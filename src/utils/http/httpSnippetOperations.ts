import { httpClient } from "./httpClient";

import {
    BackendCreateSnippet,
    BackendGetSnippet,
    BackendPage,
    BackendSnippetListItem,
    BackendUpdateSnippet,
} from "./backendSnippet";

import {
    mapCreateSnippet,
    mapGetSnippet,
    mapPaginatedSnippets,
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

const toFormData = (data: SnippetFileData): FormData => {
    const form = new FormData();
    form.append("name", data.name);
    form.append("description", data.description);
    form.append("language", data.language);
    form.append("languageVersion", data.languageVersion);
    form.append("file", data.file);
    return form;
};

export class HttpSnippetOperations {

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

    async deleteSnippet(id: string): Promise<string> {

        await httpClient.delete(`/snippets/${id}`);

        return id;
    }
}