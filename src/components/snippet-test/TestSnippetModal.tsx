import {Box, Divider, Tab, Tabs, Typography} from "@mui/material";
import {ModalWrapper} from "../common/ModalWrapper.tsx";
import {SyntheticEvent, useEffect, useState} from "react";
import {AddRounded} from "@mui/icons-material";
import {useGetTestCases, usePostTestCase, useRemoveTestCase} from "../../utils/queries.tsx";
import {TabPanel} from "./TabPanel.tsx";
import {queryClient} from "../../App.tsx";
import {useSnackbarContext} from "../../contexts/snackbarContext.tsx";
import {TestCase} from "../../types/TestCase.ts";
import {describeError} from "../../utils/http/problem.ts";

type TestSnippetModalProps = {
    open: boolean
    onClose: () => void
    snippetId: string
    canEdit: boolean
}

export const TestSnippetModal = ({open, onClose, snippetId, canEdit}: TestSnippetModalProps) => {
    const [value, setValue] = useState(0);
    const [selectAfterSave, setSelectAfterSave] = useState<string | null>(null)
    const [runningTestId, setRunningTestId] = useState<string | null>(null)
    const {createSnackbar} = useSnackbarContext()

    const {data: testCases = []} = useGetTestCases(snippetId);
    const {mutateAsync: postTestCase} = usePostTestCase(snippetId);
    const {mutateAsync: removeTestCase} = useRemoveTestCase(snippetId, {
        onSuccess: () => queryClient.invalidateQueries(['testCases', snippetId])
    });

    // Select the saved test once it shows up in the refreshed list
    useEffect(() => {
        if (!selectAfterSave) return
        const index = testCases.findIndex(t => t.id === selectAfterSave)
        if (index >= 0) {
            setValue(index)
            setSelectAfterSave(null)
        }
    }, [selectAfterSave, testCases]);

    const handleChange = (_: SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const handleSave = async (tc: Partial<TestCase>) => {
        try {
            const saved = await postTestCase(tc)
            await queryClient.invalidateQueries(['testCases', snippetId])
            setSelectAfterSave(saved.id)
            createSnackbar('success', 'Test saved')
        } catch (e) {
            createSnackbar('error', describeError(e, 'Could not save the test'))
        }
    }

    const handleRemove = async (testId: string) => {
        try {
            await removeTestCase(testId)
            setValue(0)
        } catch (e) {
            createSnackbar('error', describeError(e, 'Could not remove the test'))
        }
    }

    const newTabIndex = testCases.length

    return (
        <ModalWrapper open={open} onClose={onClose}>
            <Typography variant={"h5"}>Test snippet</Typography>
            <Divider/>
            <Box mt={2} display="flex">
                <Tabs
                    orientation="vertical"
                    variant="scrollable"
                    value={canEdit ? Math.min(value, newTabIndex) : Math.min(value, Math.max(newTabIndex - 1, 0))}
                    onChange={handleChange}
                    aria-label="Test cases"
                    sx={{borderRight: 1, borderColor: 'divider'}}
                >
                    {testCases.map((testCase) => (
                        <Tab key={testCase.id} label={testCase.name} data-testid={`test-tab-${testCase.id}`}/>
                    ))}
                    {canEdit && <Tab key="new-test" icon={<AddRounded/>} aria-label="New test" data-testid="new-test-tab"/>}
                </Tabs>
                {testCases.map((testCase, index) => (
                    <TabPanel key={testCase.id} index={index} value={value} test={testCase}
                              snippetId={snippetId} canEdit={canEdit}
                              runningTestId={runningTestId} onRunningChange={setRunningTestId}
                              setTestCase={handleSave}
                              removeTestCase={handleRemove}
                    />
                ))}
                {canEdit && (
                    <TabPanel key={`new-test-${testCases.length}`} index={newTabIndex} value={value}
                              snippetId={snippetId} canEdit={canEdit}
                              runningTestId={runningTestId} onRunningChange={setRunningTestId}
                              setTestCase={handleSave}
                    />
                )}
            </Box>
        </ModalWrapper>
    )
}
