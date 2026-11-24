import {Alert, OutlinedInput} from "@mui/material";
import {highlight, languages} from "prismjs";
import Editor from "react-simple-code-editor";
import {Bòx} from "../components/snippet-table/SnippetBox.tsx";
import {useEffect, useRef, useState} from "react";
import {openSnippetRun, RunIssue, RunServerMessage, SnippetRunConnection} from "../utils/http/snippetRunSocket.ts";

type Props = {
  snippetId: string
  running: boolean
  onFinished: () => void
}

type Status = { severity: "error" | "success" | "warning", text: string } | null

const describeIssue = (issue: RunIssue) =>
    `${issue.rule}: ${issue.message}` + (issue.span ? ` (line ${issue.span.start.line}, column ${issue.span.start.column})` : "")

export const SnippetExecution = ({snippetId, running, onFinished}: Props) => {
  const [input, setInput] = useState<string>("")
  const [output, setOutput] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const connection = useRef<SnippetRunConnection | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    let finished = false;
    let gotFrameError = false;
    setOutput([]);
    setStatus(null);
    setPrompt(null);
    setInput("");

    const finish = () => {
      if (finished) return;
      finished = true;
      setPrompt(null);
      connection.current?.close();
      connection.current = null;
      onFinishedRef.current();
    };

    const handleMessage = (message: RunServerMessage) => {
      if (cancelled) return;
      switch (message.type) {
        case "output":
          setOutput(o => [...o, message.line]);
          break;
        case "awaiting-input":
          if (message.prompt) setOutput(o => [...o, message.prompt]);
          setPrompt(message.prompt);
          break;
        case "done":
          setStatus(message.error
              ? {severity: "error", text: describeIssue(message.error)}
              : {severity: "success", text: "Finished"});
          finish();
          break;
        case "rejected":
          setStatus({severity: "warning", text: message.detail});
          finish();
          break;
        case "error":
          gotFrameError = true;
          setStatus({severity: "error", text: message.detail});
          break;
      }
    };

    openSnippetRun(snippetId, {
      onMessage: handleMessage,
      onClose: (_event, opened) => {
        if (cancelled || finished) return;
        if (!gotFrameError) {
          setStatus({
            severity: "error",
            text: opened ? "Connection lost" : "Could not connect (session expired or no access)",
          });
        }
        finish();
      },
    }).then(conn => {
      if (cancelled) conn.close(); else connection.current = conn;
    }).catch(() => {
      if (cancelled) return;
      setStatus({severity: "error", text: "Could not connect (session expired or no access)"});
      finish();
    });

    return () => {
      cancelled = true;
      connection.current?.close();
      connection.current = null;
    };
  }, [running, snippetId]);

  // when the program waits for input, put the cursor in the input box
  useEffect(() => {
    if (prompt !== null) inputRef.current?.focus();
  }, [prompt]);

  const code = output.join("\n")

  const handleEnter = (event: { key: string }) => {
    if (event.key === 'Enter' && prompt !== null) {
      connection.current?.sendInput(input)
      setOutput(o => [...o, `> ${input}`])
      setInput("")
      setPrompt(null)
    }
  };

    return (
      <>
        <Bòx flex={1} overflow={"none"} minHeight={200} bgcolor={'black'} color={'white'} code={code}>
            <Editor
              value={code}
              padding={10}
              readOnly
              onValueChange={() => {}}
              highlight={(code) => highlight(code, languages.js, 'javascript')}
              style={{
                  fontFamily: "monospace",
                  fontSize: 17,
              }}
            />
        </Bòx>
        {status && <Alert severity={status.severity}>{status.text}</Alert>}
        <OutlinedInput onKeyDown={handleEnter} value={input} onChange={e => setInput(e.target.value)}
                       disabled={prompt === null} inputRef={inputRef} inputProps={{'data-testid': 'run-input'}}
                       placeholder={prompt || "Type input and press Enter"} fullWidth/>
      </>
    )
}
