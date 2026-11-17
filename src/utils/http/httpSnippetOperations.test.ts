import {beforeEach, describe, expect, it, vi} from "vitest";

const client = vi.hoisted(() => ({get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn()}));
const socket = vi.hoisted(() => ({openSnippetRun: vi.fn()}));

vi.mock("./httpClient", () => ({httpClient: client}));
vi.mock("./snippetRunSocket", () => socket);

import {HttpSnippetOperations} from "./httpSnippetOperations";
import type {RunServerMessage, SnippetRunHandlers} from "./snippetRunSocket";

const ops = new HttpSnippetOperations();

describe("HttpSnippetOperations", () => {
    beforeEach(() => {
        Object.values(client).forEach(fn => fn.mockReset());
        socket.openSnippetRun.mockReset();
    });

    it("lists snippets with relationship, validity and sort params and maps owner names", async () => {
        client.get.mockResolvedValue({
            data: {
                content: [{
                    id: "1", name: "a", description: "d", language: "printscript", languageVersion: "1.1",
                    owner: "auth0|1", ownerName: "Jane", valid: false, compliance: "not-compliant", processing: "pending",
                }],
                page: 0, size: 10, totalElements: 1, totalPages: 1,
            },
        });

        const result = await ops.listSnippetDescriptors({
            page: 0, pageSize: 10, name: "", valid: false, relationship: "shared", sortBy: "valid", direction: "desc",
        });

        expect(client.get).toHaveBeenCalledWith("/snippets", {
            params: {
                page: 0, size: 10, name: undefined, language: undefined, valid: false,
                relationship: "shared", sortBy: "valid", direction: "desc",
            },
        });
        expect(result.snippets[0]).toMatchObject({
            author: "Jane", authorId: "auth0|1", compliance: "not-compliant", processing: "pending",
        });
        expect(result.count).toBe(1);
    });

    it("maps the detail with analysis fields", async () => {
        client.get.mockResolvedValue({
            data: {
                id: "1", name: "a", description: "d", language: "printscript", languageVersion: "1.1",
                owner: "auth0|1", ownerName: "Jane", isOwner: false,
                currentVersion: {id: "v", snippetId: "1", versionNumber: 2, originalContent: "let a = 1;", formattedContent: null, createdAt: "x"},
                compliance: "not-compliant",
                lintIssues: [{rule: "r", message: "m", span: null}],
                validationStatus: "valid", validationError: null, formatStatus: "finished", processing: "finished",
            },
        });

        const snippet = await ops.getSnippetById("1");

        expect(client.get).toHaveBeenCalledWith("/snippets/1");
        expect(snippet).toMatchObject({
            content: "let a = 1;", isOwner: false, compliance: "not-compliant", formatStatus: "finished",
            lintIssues: [{rule: "r", message: "m", span: null}],
        });
    });

    it("creates a test with POST and updates it with PUT", async () => {
        client.post.mockResolvedValue({data: {id: "t1", name: "n", input: [], output: []}});
        client.put.mockResolvedValue({data: {id: "t1", name: "n", input: ["1"], output: ["2"]}});

        await ops.postTestCase("s1", {name: "n"});
        await ops.postTestCase("s1", {id: "t1", name: "n", input: ["1"], output: ["2"]});

        expect(client.post).toHaveBeenCalledWith("/snippets/s1/tests", {name: "n", input: [], output: []});
        expect(client.put).toHaveBeenCalledWith("/snippets/s1/tests/t1", {name: "n", input: ["1"], output: ["2"]});
    });

    it("removes a test and resolves its id", async () => {
        client.delete.mockResolvedValue({});
        await expect(ops.removeTestCase("s1", "t1")).resolves.toBe("t1");
        expect(client.delete).toHaveBeenCalledWith("/snippets/s1/tests/t1");
    });

    it("saves rules sending only id, isActive and value", async () => {
        client.put.mockResolvedValue({data: []});

        await ops.modifyLintingRule([
            {id: "a", name: "a", isActive: true, value: 4, description: "x"},
            {id: "b", name: "b", isActive: false},
        ]);
        await ops.modifyFormatRule([{id: "c", name: "c", isActive: true}]);

        expect(client.put).toHaveBeenNthCalledWith(1, "/rules/lint", [
            {id: "a", isActive: true, value: 4},
            {id: "b", isActive: false, value: null},
        ]);
        expect(client.put).toHaveBeenNthCalledWith(2, "/rules/format", [{id: "c", isActive: true, value: null}]);
    });

    it("formats through the snippet endpoint and returns the formatted text", async () => {
        client.post.mockResolvedValue({data: {formatted: "let a = 1;\n", ignoredRules: []}});
        await expect(ops.formatSnippet("s1", "let a=1;")).resolves.toBe("let a = 1;\n");
        expect(client.post).toHaveBeenCalledWith("/snippets/s1/format", {content: "let a=1;"});
    });

    it("reads file types from /languages", async () => {
        client.get.mockResolvedValue({
            data: [{language: "printscript", extension: "prs", extensions: ["prs", "ps"], versions: ["1.0", "1.1"], defaultVersion: "1.0"}],
        });
        await expect(ops.getFileTypes()).resolves.toEqual([
            {language: "printscript", extension: "prs", extensions: ["prs", "ps"], versions: ["1.0", "1.1"], defaultVersion: "1.0"},
        ]);
        expect(client.get).toHaveBeenCalledWith("/languages");
    });

    describe("testSnippet", () => {
        const connect = (frames: RunServerMessage[]) => {
            const close = vi.fn();
            socket.openSnippetRun.mockImplementation(async (_id: string, handlers: SnippetRunHandlers) => {
                setTimeout(() => frames.forEach(f => handlers.onMessage(f)), 0);
                return {sendInput: vi.fn(), close};
            });
            return close;
        };

        it("streams output lines and resolves success when the test passed", async () => {
            const close = connect([
                {type: "output", line: "3"},
                {type: "done", outputs: ["3"], error: null, passed: true},
            ]);
            const lines: string[] = [];

            const result = await ops.testSnippet("s1", "t1", l => lines.push(l));

            expect(socket.openSnippetRun).toHaveBeenCalledWith("s1", expect.anything(), {type: "start", mode: "test", testId: "t1"});
            expect(lines).toEqual(["3"]);
            expect(result).toEqual({result: "success", outputs: ["3"], error: null});
            expect(close).toHaveBeenCalled();
        });

        it("resolves fail when the test did not pass", async () => {
            connect([{type: "done", outputs: ["4"], error: null, passed: false}]);
            await expect(ops.testSnippet("s1", "t1")).resolves.toMatchObject({result: "fail", outputs: ["4"]});
        });

        it("rejects with the detail of a rejected frame", async () => {
            connect([{type: "rejected", title: "UnknownTest", detail: "Test t1 does not belong to this snippet.", properties: {}}]);
            await expect(ops.testSnippet("s1", "t1")).rejects.toThrow("Test t1 does not belong to this snippet.");
        });

        it("rejects when the socket closes before done", async () => {
            socket.openSnippetRun.mockImplementation(async (_id: string, handlers: SnippetRunHandlers) => {
                setTimeout(() => handlers.onClose({} as CloseEvent, true), 0);
                return {sendInput: vi.fn(), close: vi.fn()};
            });
            await expect(ops.testSnippet("s1", "t1")).rejects.toThrow("Connection lost");
        });
    });
});
