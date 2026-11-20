import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"

const here = path.dirname(fileURLToPath(import.meta.url))

/** Bundle the main process into one ESM file so Node can load it without .js suffixes. */
export default defineConfig({
  build: {
    ssr: path.resolve(here, "src/main/index.ts"),
    outDir: path.resolve(here, "dist/main"),
    emptyOutDir: true,
    rollupOptions: {
      external: ["electron"],
    },
  },
})
