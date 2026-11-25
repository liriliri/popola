/**
 * Toast chrome — class names and data shapes only. The React host owns the
 * queue and timers; CSS targets these names.
 */

export type ToastVariant = "info" | "success" | "warning" | "error"

export type ToastItem = {
  id: string
  message: string
  variant: ToastVariant
  /** Auto-dismiss after this many ms; `0` stays until dismissed. */
  duration: number
}

export const DEFAULT_TOAST_DURATION_MS = 4000

export const toastClass = {
  toastViewport: "popola-toast-viewport",
  toast: "popola-toast",
  toastClosing: "popola-toast--closing",
  toastInfo: "popola-toast--info",
  toastSuccess: "popola-toast--success",
  toastWarning: "popola-toast--warning",
  toastError: "popola-toast--error",
  toastIcon: "popola-toast__icon",
  toastMessage: "popola-toast__message",
  toastDismiss: "popola-toast__dismiss",
} as const
