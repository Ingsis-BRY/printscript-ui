/**
 * Base URL of the snippet API.
 *
 * nginx serves the UI and the API on the same origin (`/` and `/api/*`), so the default is the
 * relative `/api`: the same image then works on any environment domain. `VITE_API_BASE_URL`
 * (relative or absolute) is only an override; unset or empty falls back to `/api`.
 */
export const DEFAULT_API_BASE_URL = "/api";

export const resolveApiBaseUrl = (configured: string | undefined): string => {
    const trimmed = configured?.trim();
    return trimmed ? trimmed : DEFAULT_API_BASE_URL;
}

export const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

/**
 * WebSocket URL for `path` under `baseUrl`. A relative base resolves against `origin`
 * (the page's own origin), and the scheme follows it: http -> ws, https -> wss.
 */
export const toWebSocketUrl = (baseUrl: string, path: string, origin: string): string => {
    const u = new URL(baseUrl, origin);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    u.pathname = `${u.pathname.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
    return u.toString();
}
