import {useState} from "react";
import {TestCase} from "../../types/TestCase.ts";
import {Alert, Autocomplete, Box, Button, Chip, TextField, Typography} from "@mui/material";
import {BugReport, Delete, Save} from "@mui/icons-material";
import {TestRunResult, useTestSnippet} from "../../utils/queries.tsx";
import {CodeIssue} from "../../utils/snippet.ts";
import {testStatusColor} from "../../utils/testStatus.ts";

type TabPanelProps = {
    index: number;
    value: number;
    snippetId: string;
    canEdit: boolean;
    test?: TestCase;
    runningTestId: string | null;
    onRunningChange: (testId: string | null) => void;
    setTestCase: (test: Partial<TestCase>) => void;
    removeTestCase?: (testId: string) => void;
}

const describeIssue = (issue: CodeIssue) =>
    `${issue.rule}: ${issue.message}` + (issue.span ? ` (line ${issue.span.start.line}, column ${issue.span.start.column})` : "")

export const TabPanel = ({
                             value, index, snippetId, canEdit, test: initialTest, runningTestId, onRunningChange,
                             setTestCase, removeTestCase
                         }: TabPanelProps) => {
    const [testData, setTestData] = useState<Partial<TestCase> | undefined>(initialTest);
    const [lines, setLines] = useState<string[]>([]);
    const [runResult, setRunResult] = useState<TestRunResult | undefined>();
    const [runError, setRunError] = useState<string | undefined>();

    const {mutateAsync: testSnippet} = useTestSnippet(snippetId);

    const testId = initialTest?.id
    const isRunning = !!testId && runningTestId === testId

    const handleRun = async () => {
        if (!testId) return
        setLines([])
        setRunResult(undefined)
        setRunError(undefined)
        onRunningChange(testId)
        try {
            const result = await testSnippet({testId, onOutput: line => setLines(l => [...l, line])})
            setRunResult(result)
        } catch (e) {
            setRunError(e instanceof Error ? e.message : "The test run failed")
        } finally {
            onRunningChange(null)
        }
    }

    const showRun = isRunning || lines.length > 0 || runResult || runError

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
            style={{width: '100%', height: '100%'}}
        >
            {value === index && (
                <Box sx={{px: 3}} display="flex" flexDirection="column" gap={2}>
                    {initialTest?.status && (
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography fontWeight="bold">Status</Typography>
                            <Chip size="small" label={initialTest.status} color={testStatusColor(initialTest.status)} data-testid="test-status"/>
                        </Box>
                    )}
                    {initialTest?.actualOutput && initialTest.status !== 'passed' && (
                        <Alert severity="info">Last output: {initialTest.actualOutput.join(" | ") || "(none)"}</Alert>
                    )}
                    {initialTest?.error && <Alert severity="error">{describeIssue(initialTest.error)}</Alert>}
                    <Box display="flex" flexDirection="column" gap={1}>
                        <Typography fontWeight="bold">Name</Typography>
                        <TextField size="small" value={testData?.name ?? ""} disabled={!canEdit} inputProps={{'data-testid': 'test-name'}}
                                   onChange={(e) => setTestData({...testData, name: e.target.value})}/>
                    </Box>
                    <Box display="flex" flexDirection="column" gap={1}>
                        <Typography fontWeight="bold">Input</Typography>
                        <Autocomplete
                            multiple
                            size="small"
                            freeSolo
                            readOnly={!canEdit}
                            value={testData?.input ?? []}
                            onChange={(_, value) => setTestData({...testData, input: value})}
                            renderTags={(value: readonly string[], getTagProps) =>
                                value.map((option: string, index: number) => (
                                    <Chip variant="outlined" label={option} {...getTagProps({index})} />
                                ))
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    inputProps={{...params.inputProps, 'data-testid': 'test-input'}}
                                />
                            )}
                            options={[]}
                        />
                    </Box>
                    <Box display="flex" flexDirection="column" gap={1}>
                        <Typography fontWeight="bold">Output</Typography>
                        <Autocomplete
                            multiple
                            size="small"
                            freeSolo
                            readOnly={!canEdit}
                            value={testData?.output ?? []}
                            onChange={(_, value) => setTestData({...testData, output: value})}
                            renderTags={(value: readonly string[], getTagProps) =>
                                value.map((option: string, index: number) => (
                                    <Chip variant="outlined" label={option} {...getTagProps({index})} />
                                ))
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    inputProps={{...params.inputProps, 'data-testid': 'test-output'}}
                                />
                            )}
                            options={[]}
                        />
                    </Box>
                    <Box display="flex" flexDirection="row" gap={1} alignItems="center">
                        {
                            (canEdit && testData?.id && removeTestCase) && (
                                <Button onClick={() => removeTestCase(testData?.id ?? "")} variant={"outlined"}
                                        color={"error"} startIcon={<Delete/>} data-testid="remove-test">
                                    Remove
                                </Button>)
                        }
                        {canEdit && (
                            <Button disabled={!testData?.name} onClick={() => setTestCase(testData ?? {})}
                                    variant={"outlined"} startIcon={<Save/>} data-testid="save-test">
                                Save
                            </Button>
                        )}
                        <Button onClick={handleRun} variant={"contained"} startIcon={<BugReport/>} data-testid="run-test"
                                disabled={!testId || runningTestId !== null}
                                disableElevation>
                            Test
                        </Button>
                        {runResult && (runResult.result === "success" ? <Chip label="Pass" color="success" data-testid="test-result"/> :
                            <Chip label="Fail" color="error" data-testid="test-result"/>)}
                    </Box>
                    {showRun && (
                        <Box display="flex" flexDirection="column" gap={1}>
                            <Typography fontWeight="bold">Run output</Typography>
                            <TextField multiline minRows={3} size="small" value={lines.join("\n")}
                                       InputProps={{readOnly: true, sx: {fontFamily: "monospace"}}}
                                       inputProps={{'data-testid': 'test-run-output'}}/>
                            {runResult?.error && <Alert severity="error">{describeIssue(runResult.error)}</Alert>}
                            {runError && <Alert severity="error">{runError}</Alert>}
                        </Box>
                    )}
                </Box>
            )}
        </div>
    );
}
