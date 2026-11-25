import type { Meta, StoryObj } from "@storybook/react-vite"
import { ToastProvider, useToast } from "../../src/toast/index"
import { Stage } from "../stage"

function ToastDemo() {
  const toast = useToast()
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 24 }}>
      <button type="button" onClick={() => toast.show("Saved provider settings.")}>
        Info
      </button>
      <button
        type="button"
        onClick={() => toast.show("Loaded 24 models.", { variant: "success" })}
      >
        Success
      </button>
      <button
        type="button"
        onClick={() => toast.show("API key looks empty.", { variant: "warning" })}
      >
        Warning
      </button>
      <button
        type="button"
        onClick={() =>
          toast.show("Could not list models (HTTP 401).", { variant: "error", duration: 0 })
        }
      >
        Error (sticky)
      </button>
      <button type="button" onClick={() => toast.clear()}>
        Clear
      </button>
    </div>
  )
}

const meta = {
  title: "Toast",
  decorators: [
    (Story) => (
      <Stage>
        <ToastProvider>
          <Story />
        </ToastProvider>
      </Stage>
    ),
  ],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Demo: Story = {
  render: () => <ToastDemo />,
}
