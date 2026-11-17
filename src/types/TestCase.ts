import {CodeIssue} from "../utils/snippet.ts";

export type TestStatus = 'pending' | 'passed' | 'failed' | 'error'

export type TestCase = {
    id: string;
    name: string;
    input?: string[];
    output?: string[];
    status?: TestStatus;
    actualOutput?: string[] | null;
    error?: CodeIssue | null;
    lastRunAt?: string | null;
};
