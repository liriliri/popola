import os from "node:os"
import path from "node:path"

function expandHome(input: string): string {
  if (input === "~") return os.homedir()
  if (input.startsWith("~/")) return path.join(os.homedir(), input.slice(2))
  return input
}

/** App data root: `POPOLA_HOME`, or `~/.popola`. */
export function resolvePopolaHome(env: NodeJS.ProcessEnv = process.env): string {
  return path.resolve(expandHome(env.POPOLA_HOME ?? "~/.popola"))
}
