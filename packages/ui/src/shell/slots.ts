export const shellSlot = {
  shellHeader: "shell.header",
  shellSidebar: "shell.sidebar",
} as const

export type ShellSlotProps = {
  "shell.header": { title?: string }
  "shell.sidebar": Record<string, never>
}
