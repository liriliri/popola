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
} as const

export type ShellSlotProps = {
  "shell.header": { title?: string }
  "shell.sidebar": Record<string, never>
}
