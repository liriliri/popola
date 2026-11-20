import type { Meta, StoryObj } from "@storybook/react-vite"
import { createStore } from "popola-ui"
import { PopolaComposer } from "popola-ui-react"
import { Stage } from "../stage"

const meta = {
  title: "Composer",
  component: PopolaComposer,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PopolaComposer>

export default meta
type Story = StoryObj<typeof meta>

function show(store = createStore()) {
  return (
    <Stage store={store} onSend={() => {}} onStop={() => store.dispatch({ type: "status", status: "idle" })}>
      <div style={{ flex: 1 }} />
      <PopolaComposer />
    </Stage>
  )
}

/** Nothing to send yet. */
export const Idle: Story = {
  render: () => show(),
}

const draft = createStore({
  composer: { text: "Where is the loader?", attachments: [] },
})

/** There is text, so sending is available. */
export const Draft: Story = {
  render: () => show(draft),
}

const busy = createStore({ status: "busy" })

/** A run is in flight, so stopping is available too. */
export const Busy: Story = {
  render: () => show(busy),
}

const attached = createStore({
  composer: {
    text: "",
    attachments: [{ id: "a1", name: "loader.ts" }],
  },
})

/** A file is attached above the input. */
export const Attachment: Story = {
  render: () => show(attached),
}
