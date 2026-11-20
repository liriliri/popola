import type { Meta, StoryObj } from "@storybook/react-vite"
import { createStore } from "popola-ui"
import { PopolaConversation, PopolaPermissions } from "popola-ui-react"
import { message, textPart } from "../mock"
import { Stage } from "../stage"

const meta = {
  title: "Permission",
  component: PopolaPermissions,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PopolaPermissions>

export default meta
type Story = StoryObj<typeof meta>

const asking = createStore({
  status: "busy",
  messages: [message("u1", "user", [textPart("u1", "Clean the build output.")])],
  permissions: [
    {
      id: "p1",
      action: "bash",
      title: "Run a command",
      resources: ["rm -rf build"],
      toolName: "bash",
    },
  ],
})

/** The agent is waiting on a decision before it continues. */
export const Asking: Story = {
  render: () => (
    <Stage
      store={asking}
      onPermissionReply={(id) => asking.dispatch({ type: "permission.resolved", id })}
    >
      <PopolaConversation />
      <PopolaPermissions />
    </Stage>
  ),
}
