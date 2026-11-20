import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ReactNode } from "react"
import { PopolaCard, PopolaProvider } from "popola-ui-react"
import { STREAMING_TEXT, message, textPart, toolCall, toolPart } from "./mock.js"

const meta = {
  title: "Popola/Card",
  component: PopolaCard,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PopolaCard>

export default meta
type Story = StoryObj<typeof meta>

function Frame(props: { children: ReactNode }) {
  return (
    <PopolaProvider>
      <div style={{ padding: 24, maxWidth: 820 }}>{props.children}</div>
    </PopolaProvider>
  )
}

export const User: Story = {
  args: {
    message: message("m1", "user", [textPart("p1", "Find every reader of the service registry.")]),
  },
  render: (args) => (
    <Frame>
      <PopolaCard {...args} />
    </Frame>
  ),
}

export const Assistant: Story = {
  args: {
    message: message("m2", "assistant", [
      textPart("p2", "The registry is read in three places. Starting with the loader."),
    ]),
  },
  render: (args) => (
    <Frame>
      <PopolaCard {...args} />
    </Frame>
  ),
}

/** The assistant is still writing — the text arrives word by word. */
export const Streaming: Story = {
  args: {
    message: message("m3", "assistant", [textPart("p3", STREAMING_TEXT)]),
    streaming: true,
  },
  render: (args) => (
    <Frame>
      <PopolaCard {...args} />
    </Frame>
  ),
}

export const ToolRunning: Story = {
  args: {
    message: message("m4", "assistant", [
      toolPart(
        "p4",
        toolCall({
          id: "c1",
          name: "bash",
          title: "bash",
          status: "running",
          input: { command: "bun test packages/core" },
        }),
      ),
    ]),
  },
  render: (args) => (
    <Frame>
      <PopolaCard {...args} />
    </Frame>
  ),
}

export const ToolDone: Story = {
  args: {
    message: message("m5", "assistant", [
      toolPart(
        "p5",
        toolCall({
          id: "c2",
          name: "grep",
          title: "grep",
          status: "completed",
          input: { query: "service-registry" },
          output: "packages/core/src/service/registry.ts:42\npackages/core/src/service/loader.ts:118",
        }),
      ),
    ]),
  },
  render: (args) => (
    <Frame>
      <PopolaCard {...args} />
    </Frame>
  ),
}

export const ToolFailed: Story = {
  args: {
    message: message("m6", "assistant", [
      toolPart(
        "p6",
        toolCall({
          id: "c3",
          name: "read_file",
          title: "read_file",
          status: "error",
          input: { path: "packages/core/src/missing.ts" },
          error: "ENOENT: no such file or directory",
        }),
      ),
    ]),
  },
  render: (args) => (
    <Frame>
      <PopolaCard {...args} />
    </Frame>
  ),
}
