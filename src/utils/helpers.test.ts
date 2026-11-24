import {describe, expect, it} from "vitest";
import {highlightCode} from "./editorHighlight";
import {describeError, getErrorSpan, getProblem} from "./http/problem";
import {defaultValueFor} from "./rules";
import {getFileLanguage} from "./snippet";
import {testStatusColor} from "./testStatus";
import {mapSnippetListItem} from "./http/snippetMapper";

describe("highlightCode", () => {
    it("wraps only the failing line (1-based) in the error marker", () => {
        const html = highlightCode("let a = 1;\nlet b = ;\nlet c = 3;", 2).split("\n");
        expect(html).toHaveLength(3);
        expect(html[0]).not.toContain("code-error-line");
        expect(html[1]).toContain('<span class="code-error-line">');
        expect(html[2]).not.toContain("code-error-line");
    });

    it("adds no marker without an error line", () => {
        expect(highlightCode("let a = 1;")).not.toContain("code-error-line");
    });
});

describe("problem helpers", () => {
    const error = Object.assign(new Error("Unexpected token"), {
        problem: {
            title: "InvalidSnippetContent", detail: "Unexpected token", rule: "syntax", message: "Unexpected token",
            span: {start: {line: 3, column: 7}, end: {line: 3, column: 8}},
        },
    });

    it("reads the attached problem and its span", () => {
        expect(getProblem(error)?.rule).toBe("syntax");
        expect(getErrorSpan(error)?.start).toEqual({line: 3, column: 7});
    });

    it("describes a located problem as rule, message, line and column", () => {
        expect(describeError(error, "fallback")).toBe("syntax — Unexpected token (line 3, column 7)");
    });

    it("falls back to the error message, then to the fallback text", () => {
        expect(describeError(new Error("boom"), "fallback")).toBe("boom");
        expect(describeError("nope", "fallback")).toBe("fallback");
        expect(getErrorSpan(new Error("x"))).toBeUndefined();
    });
});

describe("defaultValueFor", () => {
    it("keeps an existing value", () => {
        expect(defaultValueFor({id: "a", name: "a", isActive: false, type: "integer", value: 4, min: 0})).toBe(4);
    });

    it("uses the minimum for integer rules and the first option for enum rules", () => {
        expect(defaultValueFor({id: "a", name: "a", isActive: false, type: "integer", value: null, min: 2})).toBe(2);
        expect(defaultValueFor({id: "a", name: "a", isActive: false, type: "integer", value: null, min: 0, default: 4})).toBe(4);
        expect(defaultValueFor({id: "b", name: "b", isActive: false, type: "enum", options: ["camelCase", "snake_case"], default: "snake_case"})).toBe("snake_case");
        expect(defaultValueFor({id: "a", name: "a", isActive: false, type: "integer", value: null})).toBe(0);
        expect(defaultValueFor({id: "b", name: "b", isActive: false, type: "enum", options: ["camelCase", "snake_case"]})).toBe("camelCase");
    });

    it("has no value for boolean rules", () => {
        expect(defaultValueFor({id: "c", name: "c", isActive: false, type: "boolean"})).toBeNull();
    });
});

describe("getFileLanguage", () => {
    const types = [{language: "printscript", extension: "prs", extensions: ["prs", "ps"], versions: ["1.0"], defaultVersion: "1.0"}];

    it("matches any of the extensions", () => {
        expect(getFileLanguage(types, "ps")).toMatchObject({language: "printscript"});
        expect(getFileLanguage(types, "prs")).toMatchObject({language: "printscript"});
        expect(getFileLanguage(types, "py")).toBeFalsy();
    });

    it("falls back to the single extension", () => {
        expect(getFileLanguage([{language: "x", extension: "x", versions: [], defaultVersion: ""}], "x")).toMatchObject({language: "x"});
    });
});

describe("misc mappings", () => {
    it("colors test statuses", () => {
        expect(testStatusColor("passed")).toBe("success");
        expect(testStatusColor("failed")).toBe("error");
        expect(testStatusColor("error")).toBe("warning");
        expect(testStatusColor("pending")).toBe("default");
    });

    it("falls back to the owner id when the owner name is empty", () => {
        const snippet = mapSnippetListItem({
            id: "1", name: "n", description: "", language: "printscript", languageVersion: "1.1",
            owner: "auth0|1", ownerName: "", valid: true, compliance: "compliant", processing: "finished",
        });
        expect(snippet.author).toBe("auth0|1");
    });
});
