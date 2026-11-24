/**
 * cy.intercept can't stub WebSockets, so the run socket is replaced in the page with a scripted fake.
 * `frames(startMessage)` returns the server frames to play back for that start; each one arrives a tick
 * apart, like the real server streaming lines. `input` messages are recorded for assertions.
 */
export type RunFrame = Record<string, unknown>

export type FakeRunSocketScript = {
    frames: (start: Record<string, unknown>) => RunFrame[]
    /** frames to answer each `input` message with (interactive mode) */
    onInput?: (value: string) => RunFrame[]
}

export type FakeRunSocketLog = { urls: string[]; protocols: string[][]; sent: Record<string, unknown>[] }

export function installFakeRunSocket(win: Window, script: FakeRunSocketScript): FakeRunSocketLog {
    const log: FakeRunSocketLog = {urls: [], protocols: [], sent: []}

    class FakeRunSocket {
        static CONNECTING = 0
        static OPEN = 1
        static CLOSING = 2
        static CLOSED = 3
        readyState = FakeRunSocket.CONNECTING
        protocol = "snippet-run.v1"
        onopen: (() => void) | null = null
        onmessage: ((event: { data: string }) => void) | null = null
        onclose: ((event: { code: number; reason: string }) => void) | null = null
        onerror: (() => void) | null = null

        constructor(url: string, protocols: string[] = []) {
            log.urls.push(url)
            log.protocols.push(protocols)
            setTimeout(() => {
                this.readyState = FakeRunSocket.OPEN
                this.onopen?.()
            }, 10)
        }

        send(data: string) {
            const message = JSON.parse(data) as Record<string, unknown>
            log.sent.push(message)
            const frames = message.type === "input"
                ? script.onInput?.(String(message.value)) ?? []
                : script.frames(message)
            frames.forEach((frame, i) => setTimeout(() => this.receive(frame), 20 * (i + 1)))
        }

        close(code = 1000) {
            if (this.readyState === FakeRunSocket.CLOSED) return
            this.readyState = FakeRunSocket.CLOSED
            setTimeout(() => this.onclose?.({code, reason: ""}), 0)
        }

        private receive(frame: RunFrame) {
            if (this.readyState !== FakeRunSocket.OPEN) return
            this.onmessage?.({data: JSON.stringify(frame)})
            const code = typeof frame.status === "number" && frame.type === "error" ? 4000 + frame.status : undefined
            if (code) this.close(code)
        }
    }

    Object.defineProperty(win, "WebSocket", {value: FakeRunSocket, configurable: true, writable: true})
    return log
}
