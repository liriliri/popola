import type { Meta, StoryObj } from "@storybook/react-vite"
import { createStore, type PopolaStore } from "popola-ui"
import { PopolaProvider, PopolaShell } from "popola-ui-react"
import { STREAMING_TEXT, message, textPart, toolCall, toolPart } from "../mock"

const meta = {
  title: "Shell",
  component: PopolaShell,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PopolaShell>

export default meta
type Story = StoryObj<typeof meta>

const settled = createStore({
  messages: [
    message("u1", "user", [textPart("u1-text", "Find every reader of the service registry.")]),
    message("a1", "assistant", [
      textPart("a1-text", "The registry is read in three places. Starting with the loader."),
      toolPart(
        "a1-grep",
        toolCall({
          id: "c1",
          name: "grep",
          title: "grep",
          status: "completed",
          input: { query: "service-registry" },
          output: "packages/core/src/service/registry.ts:42\npackages/core/src/service/loader.ts:118",
        }),
      ),
    ]),
    message("u2", "user", [textPart("u2-text", "Read the loader.")]),
    message("a2", "assistant", [
      toolPart(
        "a2-read",
        toolCall({
          id: "c2",
          name: "read_file",
          title: "read_file",
          status: "error",
          input: { path: "packages/core/src/missing.ts" },
          error: "ENOENT: no such file or directory",
        }),
      ),
      textPart(
        "a2-text",
        "That path is not in this checkout. The loader is packages/core/src/service/loader.ts.",
      ),
    ]),
  ],
})

const working = createStore({
  status: "busy",
  messages: [
    message("u1", "user", [textPart("u1-text", "Add a test for the loader.")]),
    message("a1", "assistant", [
      textPart("a1-text", STREAMING_TEXT),
      toolPart(
        "a1-bash",
        toolCall({
          id: "c3",
          name: "bash",
          title: "bash",
          status: "running",
          input: { command: "bun test packages/core" },
        }),
      ),
    ]),
  ],
})

let sent = 0

function Stage(props: { store: PopolaStore }) {
  return (
    <PopolaProvider
      store={props.store}
      onSend={({ text }) => {
        const id = `sent-${++sent}`
        props.store.dispatch({
          type: "message.started",
          message: message(id, "user", [textPart(`${id}-text`, text)]),
        })
      }}
      onStop={() => {
        props.store.dispatch({ type: "status", status: "idle" })
      }}
    >
      <PopolaShell title="popola" />
    </PopolaProvider>
  )
}

/** A finished exchange: a reply, a completed tool, and a failed read. */
export const Settled: Story = {
  render: () => <Stage store={settled} />,
}

/** The assistant is still writing, and a command is still running. */
export const Working: Story = {
  render: () => <Stage store={working} />,
}
