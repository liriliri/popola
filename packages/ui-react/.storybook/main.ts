import path from "node:path"
import { fileURLToPath } from "node:url"
import type { StorybookConfig } from "@storybook/react-vite"

const here = path.dirname(fileURLToPath(import.meta.url))
const pkg = path.resolve(here, "..")
const repo = path.resolve(pkg, "../..")

const config: StorybookConfig = {
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  stories: ["../stories/**/*.stories.@(ts|tsx)"],
  viteFinal: async (config) => {
    config.resolve = config.resolve ?? {}
    // Point the package names at their sources so a story always reflects the
    // working tree, without a build step in between.
    config.resolve.alias = [
      ...(Array.isArray(config.resolve.alias) ? config.resolve.alias : []),
      { find: /^popola-ui-react$/, replacement: path.resolve(repo, "packages/ui-react/src/index.ts") },
      { find: /^popola-ui$/, replacement: path.resolve(repo, "packages/ui/src/index.ts") },
    ]
    return config
  },
}

export default config
