import type { ShowToastOptions, ToastApi } from "popola-ui-react"

let showImpl: ToastApi["show"] | null = null

/** Wire the MobX store to {@link ToastProvider} without React. */
export function bindAppToast(show: ToastApi["show"] | null): void {
  showImpl = show
}

export function appToast(message: string, options?: ShowToastOptions): void {
  const trimmed = message.trim()
  if (!trimmed) return
  showImpl?.(trimmed, options)
}
