import axios from "axios";

export const httpClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        Accept: "application/json",
    },
});

// The backend returns errors as RFC 7807 ProblemDetail; surface its `detail`
// (e.g. broken language rule with line and column) as the Error message.
httpClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (axios.isAxiosError(error)) {
            let data = error.response?.data as unknown;
            if (data instanceof Blob) {
                try {
                    data = JSON.parse(await data.text());
                } catch {
                    data = undefined;
                }
            }
            const problem = data as { detail?: string; title?: string } | undefined;
            const message = problem?.detail ?? problem?.title;
            if (message) {
                error.message = message;
            }
        }
        return Promise.reject(error);
    },
);
