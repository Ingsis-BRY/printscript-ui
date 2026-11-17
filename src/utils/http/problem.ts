import type {CodeIssue} from "../snippet";

export type Problem = {
    title?: string;
    detail?: string;
    rule?: string;
    message?: string;
    span?: CodeIssue["span"];
}

/** The RFC 7807 body the http client attached to a failed request, if any. */
export const getProblem = (e: unknown): Problem | undefined => {
    if (typeof e === "object" && e !== null && "problem" in e) {
        return (e as { problem?: Problem }).problem;
    }
    return undefined;
}

export const getErrorSpan = (e: unknown): CodeIssue["span"] | undefined => getProblem(e)?.span ?? undefined

/** `rule — message (line L, column C)` when the problem carries a source location, otherwise the error message. */
export const describeError = (e: unknown, fallback: string): string => {
    const problem = getProblem(e);
    if (problem?.rule && problem.message) {
        const span = problem.span;
        return `${problem.rule} — ${problem.message}` + (span ? ` (line ${span.start.line}, column ${span.start.column})` : "");
    }
    return e instanceof Error ? e.message : fallback;
}
