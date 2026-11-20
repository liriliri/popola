import type { Preview } from "@storybook/react-vite"
import "../../ui/src/styles.css"

const preview: Preview = {
  decorators: [
    // The shell is a full-height column, so give every story the viewport.
    (Story) => (
      <div style={{ height: "100vh", display: "flex", minHeight: 0 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
