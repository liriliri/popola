import type { Meta, StoryObj } from "@storybook/react-vite"
import { createStore } from "popola-ui"
import { PopolaConversation, PopolaProvider } from "popola-ui-react"
import { message, textPart } from "./mock.js"

const meta = {
  title: "Popola/Conversation",
  component: PopolaConversation,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PopolaConversation>

export default meta
type Story = StoryObj<typeof meta>

const awaitingStore = createStore({
  status: "busy",
  messages: [message("m1", "user", [textPart("p1", "Find every reader of the service registry.")])],
})

/** The user has sent a message. The assistant message does not exist yet. */
export const Awaiting: Story = {
  render: () => (
    <PopolaProvider store={awaitingStore}>
      <div style={{ flex: 1, display: "flex", minWidth: 0, minHeight: 0 }}>
        <PopolaConversation />
      </div>
    </PopolaProvider>
  ),
}
