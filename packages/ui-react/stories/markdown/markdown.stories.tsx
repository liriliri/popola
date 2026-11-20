import type { Meta, StoryObj } from "@storybook/react-vite"
import { PopolaMarkdown } from "popola-ui-react"
import { Column, Stage } from "../stage"

const meta = {
  title: "Markdown",
  component: PopolaMarkdown,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PopolaMarkdown>

export default meta
type Story = StoryObj<typeof meta>

function show(args: Story["args"]) {
  return (
    <Stage>
      <Column>
        <PopolaMarkdown {...args} />
      </Column>
    </Stage>
  )
}

/** Everything an answer can hold. */
export const KitchenSink: Story = {
  args: {
    text: [
      "## What I changed",
      "",
      "The registry is read in three places, so the loader now owns the lookup.",
      "",
      "### The loader",
      "",
      "1. `readService()` returns the parsed entry.",
      "2. The CLI bootstrap reads the same file.",
      "3. The desktop bridge keeps its own cache.",
      "",
      "> The cache was the reason the desktop app saw stale entries.",
      "",
      "```ts",
      "export function readService(root: string): Service | undefined {",
      "  const entry = parse(readFileSync(join(root, \"service.json\")))",
      "  return entry?.service",
      "}",
      "```",
      "",
      "### Checklist",
      "",
      "- [x] Read the loader",
      "- [x] Add a test for the lookup",
      "- [ ] Wire the bridge to the new path",
      "",
      "| File | Change |",
      "| --- | --- |",
      "| `loader.ts` | owns the lookup |",
      "| `registry.ts` | drops the cache |",
      "",
      "See the [service registry](https://example.com/docs/registry) for the schema.",
      "",
      "---",
      "",
      "Done. The old `~~deprecated~~` path still works.",
    ].join("\n"),
  },
  render: (args) => show(args),
}

/** The answer arrives word by word. */
export const Streaming: Story = {
  args: {
    text: "The registry is read in three places: the service loader, the CLI bootstrap, and the desktop bridge.",
    streaming: true,
  },
  render: (args) => show(args),
}

/** Nothing has arrived yet. */
export const Waiting: Story = {
  args: {
    text: "",
    streaming: true,
  },
  render: (args) => show(args),
}

/** A block that is finished, and the one still being written. */
export const StreamingBlocks: Story = {
  args: {
    text: "## What I changed\n\nThe loader now owns the lookup, so the desktop bridge",
    streaming: true,
  },
  render: (args) => show(args),
}

/** A checklist an agent writes while it works. */
export const Tasks: Story = {
  args: {
    text: ["- [x] Read the loader", "- [x] Add a test", "- [ ] Wire the bridge"].join("\n"),
  },
  render: (args) => show(args),
}

/** Code the agent quotes. */
export const Code: Story = {
  args: {
    text: [
      "The lookup moved into the loader:",
      "",
      "```ts",
      "export function readService(root: string): Service | undefined {",
      "  const entry = parse(readFileSync(join(root, \"service.json\")))",
      "  return entry?.service",
      "}",
      "```",
    ].join("\n"),
  },
  render: (args) => show(args),
}

/** A table the agent reports in. */
export const Table: Story = {
  args: {
    text: [
      "| File | Change | Lines |",
      "| --- | --- | --- |",
      "| `loader.ts` | owns the lookup | +18 |",
      "| `registry.ts` | drops the cache | -42 |",
      "| `loader.test.ts` | covers the lookup | +64 |",
    ].join("\n"),
  },
  render: (args) => show(args),
}
