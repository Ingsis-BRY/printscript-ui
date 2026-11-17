import {getAccessToken} from "./accessToken.ts";

export const SNIPPET_RUN_SUBPROTOCOL = "snippet-run.v1";

export type RunIssue = {
    rule: string
    message: string
    span: { start: { line: number, column: number }, end: { line: number, column: number } } | null
}

export type RunServerMessage =
    | { type: "output", line: string }
    | { type: "awaiting-input", prompt: string }
    | { type: "done", outputs: string[], error: RunIssue | null }
    | { type: "rejected", title: string, detail: string, properties: Record<string, unknown> }
    | { type: "error", status: number, title: string, detail: string }

export type RunClientMessage =
    | { type: "start", mode?: "interactive" }
    | { type: "input", value: string }

export type SnippetRunConnection = {
    sendInput(value: string): void
    close(): void
}

export type SnippetRunHandlers = {
    onMessage: (message: RunServerMessage) => void
    onClose: (event: CloseEvent, opened: boolean) => void
}

export const snippetRunUrl = (snippetId: string): string => {
    const u = new URL(import.meta.env.VITE_API_BASE_URL ?? "/api", window.location.origin);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    u.pathname = `${u.pathname.replace(/\/$/, "")}/snippets/${encodeURIComponent(snippetId)}/run`;
    return u.toString();
}

export const openSnippetRun = async (snippetId: string, handlers: SnippetRunHandlers): Promise<SnippetRunConnection> => {
    const token = await getAccessToken();
    const ws = new WebSocket(
        snippetRunUrl(snippetId),
        token ? [SNIPPET_RUN_SUBPROTOCOL, "bearer." + token] : [SNIPPET_RUN_SUBPROTOCOL],
    );
    let opened = false;
    const send = (message: RunClientMessage) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
    };
    ws.onopen = () => {
        opened = true;
        send({type: "start"});
    };
    ws.onmessage = (event) => {
        let message: RunServerMessage;
        try {
            message = JSON.parse(event.data as string) as RunServerMessage;
        } catch {
            return; // ignore malformed frames
        }
        handlers.onMessage(message);
    };
    ws.onclose = (event) => handlers.onClose(event, opened);
    return {
        sendInput: (value) => send({type: "input", value}),
        close: () => {
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close(1000);
        },
    };
}
