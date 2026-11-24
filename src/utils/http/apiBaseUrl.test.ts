import {describe, expect, it} from "vitest";
import {DEFAULT_API_BASE_URL, resolveApiBaseUrl, toWebSocketUrl} from "./apiBaseUrl";

describe("resolveApiBaseUrl", () => {
    it("defaults to the same-origin /api when unset or empty", () => {
        expect(resolveApiBaseUrl(undefined)).toBe(DEFAULT_API_BASE_URL);
        expect(resolveApiBaseUrl("")).toBe("/api");
        expect(resolveApiBaseUrl("   ")).toBe("/api");
    });

    it("keeps an explicit relative or absolute override", () => {
        expect(resolveApiBaseUrl("/backend")).toBe("/backend");
        expect(resolveApiBaseUrl("https://api.example.org/api")).toBe("https://api.example.org/api");
    });
});

describe("toWebSocketUrl", () => {
    const path = "snippets/abc/run";

    it("uses wss on an https page with a relative base", () => {
        expect(toWebSocketUrl("/api", path, "https://dev.example.org"))
            .toBe("wss://dev.example.org/api/snippets/abc/run");
    });

    it("uses ws on an http page with a relative base, keeping the port", () => {
        expect(toWebSocketUrl("/api", path, "http://localhost:5173"))
            .toBe("ws://localhost:5173/api/snippets/abc/run");
    });

    it("ignores the page origin for an absolute base and follows its scheme", () => {
        expect(toWebSocketUrl("https://api.example.org/api/", path, "http://localhost:5173"))
            .toBe("wss://api.example.org/api/snippets/abc/run");
        expect(toWebSocketUrl("http://api.example.org", "/" + path, "https://x.org"))
            .toBe("ws://api.example.org/snippets/abc/run");
    });
});
