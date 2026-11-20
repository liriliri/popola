import path from "node:path"
import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const here = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: path.resolve(here, "src/renderer"),
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^popola-ui-react$/, replacement: path.resolve(here, "../ui-react/src/index.ts") },
      { find: /^popola-ui$/, replacement: path.resolve(here, "../ui/src/index.ts") },
    ],
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: path.resolve(here, "dist/renderer"),
    emptyOutDir: true,
  },
})
