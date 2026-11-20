import type { Meta, StoryObj } from "@storybook/react-vite"
import { createStore } from "popola-ui"
import { PopolaConversation } from "popola-ui-react"
import { message, textPart } from "../mock"
import { Stage } from "../stage"

const meta = {
  title: "Conversation",
  component: PopolaConversation,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PopolaConversation>

export default meta
type Story = StoryObj<typeof meta>

/** Nothing has been said. */
export const Empty: Story = {
  render: () => (
    <Stage>
      <PopolaConversation />
    </Stage>
  ),
}

const awaiting = createStore({
  status: "busy",
  messages: [message("u1", "user", [textPart("u1-text", "Find every reader of the service registry.")])],
})

/** The user has sent a message. The assistant message does not exist yet. */
export const Awaiting: Story = {
  render: () => (
    <Stage store={awaiting}>
      <PopolaConversation />
    </Stage>
  ),
}
