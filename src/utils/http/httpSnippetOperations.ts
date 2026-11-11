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
    UpdateSnippet,
} from "../snippet";

export class HttpSnippetOperations {

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

    async listSnippetDescriptors(
        page: number,
        pageSize: number,
        name?: string
    ): Promise<PaginatedSnippets> {

        const response = await httpClient.get<
            BackendPage<BackendSnippetListItem>
        >("/snippets", {
            params: {
                page,
                size: pageSize,
                name
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