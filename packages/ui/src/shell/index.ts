export const shellClass = {
  shell: "popola-shell",
  shellHeader: "popola-shell__header",
  shellBody: "popola-shell__body",
  shellMain: "popola-shell__main",
  shellSidebar: "popola-shell__sidebar",
  shellFooter: "popola-shell__footer",
} as const

export const shellSlot = {
  shellHeader: "shell.header",
  shellSidebar: "shell.sidebar",
  shellMainLeading: "shell.main.leading",
} as const

export type ShellSlotProps = {
  "shell.header": { title?: string }
  "shell.sidebar": Record<string, never>
  /** Optional chrome above the main column (e.g. a window drag strip). */
  "shell.main.leading": Record<string, never>
}
