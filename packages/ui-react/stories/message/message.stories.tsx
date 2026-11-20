import type { Meta, StoryObj } from "@storybook/react-vite"
import { PopolaCard } from "popola-ui-react"
import { STREAMING_TEXT, errorPart, message, reasoningPart, textPart, toolCall, toolPart } from "../mock"
import { Column, Stage } from "../stage"

const meta = {
  title: "Message",
  component: PopolaCard,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PopolaCard>

export default meta
type Story = StoryObj<typeof meta>

function show(args: Story["args"]) {
  return (
    <Stage>
      <Column>
        <PopolaCard {...args} />
      </Column>
    </Stage>
  )
}

export const User: Story = {
  args: {
    message: message("u1", "user", [textPart("u1", "Find every reader of the service registry.")]),
  },
  render: (args) => show(args),
}

export const Assistant: Story = {
  args: {
    message: message("a1", "assistant", [
      textPart("a1", "The registry is read in three places. Starting with the loader."),
    ]),
  },
  render: (args) => show(args),
}

/** The assistant message exists, but not a single word has arrived. */
export const Waiting: Story = {
  args: {
    message: message("a1", "assistant", [textPart("a1", "")]),
    streaming: true,
  },
  render: (args) => show(args),
}

/** The assistant is still writing. */
export const Streaming: Story = {
  args: {
    message: message("a1", "assistant", [textPart("a1", STREAMING_TEXT)]),
    streaming: true,
  },
  render: (args) => show(args),
}

export const Reasoning: Story = {
  args: {
    message: message("a1", "assistant", [
      reasoningPart("a1-r", "The loader is the path every request goes through, so start there."),
      textPart("a1", "I will read the loader first."),
    ]),
  },
  render: (args) => show(args),
}

export const ToolRunning: Story = {
  args: {
    message: message("a1", "assistant", [
      toolPart(
        "a1",
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
  render: (args) => show(args),
}

export const ToolDone: Story = {
  args: {
    message: message("a1", "assistant", [
      toolPart(
        "a1",
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
  },
  render: (args) => show(args),
}

export const ToolFailed: Story = {
  args: {
    message: message("a1", "assistant", [
      toolPart(
        "a1",
        toolCall({
          id: "c1",
          name: "read_file",
          title: "read_file",
          status: "error",
          input: { path: "packages/core/src/missing.ts" },
          error: "ENOENT: no such file or directory",
        }),
      ),
    ]),
  },
  render: (args) => show(args),
}

export const Failed: Story = {
  args: {
    message: message("a1", "assistant", [errorPart("a1", "The agent stopped before it could answer.")]),
  },
  render: (args) => show(args),
}

/** The text of a message is Markdown, so it is rendered as Markdown. */
export const Markdown: Story = {
  args: {
    message: message("a1", "assistant", [
      textPart(
        "a1",
        [
          "## What I changed",
          "",
          "The registry is read in three places, so the loader now owns the lookup.",
          "",
          "- [x] Read the loader",
          "- [ ] Wire the bridge to the new path",
          "",
          "```ts",
          "export function readService(root: string): Service | undefined {",
          "  return parse(readFileSync(join(root, \"service.json\"))).service",
          "}",
          "```",
        ].join("\n"),
      ),
    ]),
  },
  render: (args) => show(args),
}
