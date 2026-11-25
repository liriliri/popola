import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type AnimationEvent as ReactAnimationEvent,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react"
import className from "licia/className"
import {
  DEFAULT_TOAST_DURATION_MS,
  popolaClass,
  type ToastItem,
  type ToastVariant,
} from "popola-ui"
import { usePortalTheme, type PopolaTheme } from "../context"

export type { ToastVariant }

export type ShowToastOptions = {
  variant?: ToastVariant
  /** Auto-dismiss ms; `0` stays until dismissed. Default 4000. */
  duration?: number
  id?: string
}

export type ToastApi = {
  show: (message: string, options?: ShowToastOptions) => string
  dismiss: (id: string) => void
  clear: () => void
}

const ToastContext = createContext<ToastApi | null>(null)

let toastSeq = 0

function nextToastId(): string {
  toastSeq += 1
  return `toast-${toastSeq}`
}

const VARIANT_CLASS: Record<ToastVariant, string> = {
  info: popolaClass.toastInfo,
  success: popolaClass.toastSuccess,
  warning: popolaClass.toastWarning,
  error: popolaClass.toastError,
}

function ToastIcon(props: { variant: ToastVariant }) {
  const size = 16
  const stroke = 2
  switch (props.variant) {
    case "success":
      return <CheckCircle2 size={size} strokeWidth={stroke} aria-hidden />
    case "warning":
      return <AlertTriangle size={size} strokeWidth={stroke} aria-hidden />
    case "error":
      return <AlertCircle size={size} strokeWidth={stroke} aria-hidden />
    default:
      return <Info size={size} strokeWidth={stroke} aria-hidden />
  }
}

function ToastCard(props: {
  item: ToastItem
  dismissLabel: string
  onDismiss: (id: string) => void
}) {
  const { item } = props
  const [closing, setClosing] = useState(false)
  const remainingRef = useRef(item.duration)
  const startedAtRef = useRef(0)
  const timerRef = useRef<number | null>(null)

  const beginClose = useCallback(() => setClosing(true), [])

  const pauseTimer = useCallback(() => {
    if (timerRef.current === null) return
    window.clearTimeout(timerRef.current)
    timerRef.current = null
    remainingRef.current -= Date.now() - startedAtRef.current
  }, [])

  const resumeTimer = useCallback(() => {
    if (item.duration === 0 || closing || timerRef.current !== null) return
    startedAtRef.current = Date.now()
    timerRef.current = window.setTimeout(beginClose, Math.max(remainingRef.current, 0))
  }, [item.duration, closing, beginClose])

  useEffect(() => {
    resumeTimer()
    return pauseTimer
  }, [resumeTimer, pauseTimer])

  const onAnimationEnd = (event: ReactAnimationEvent<HTMLDivElement>) => {
    if (event.animationName.includes("popola-toast-out")) {
      props.onDismiss(item.id)
    }
  }

  return (
    <div
      className={className(
        popolaClass.toast,
        VARIANT_CLASS[item.variant],
        closing ? popolaClass.toastClosing : undefined,
      )}
      role={item.variant === "error" || item.variant === "warning" ? "alert" : "status"}
      onMouseEnter={pauseTimer}
      onMouseLeave={(event) => {
        if (!event.currentTarget.contains(document.activeElement)) resumeTimer()
      }}
      onFocusCapture={pauseTimer}
      onBlurCapture={(event) => {
        if (
          !event.currentTarget.contains(event.relatedTarget as Node | null) &&
          !event.currentTarget.matches(":hover")
        ) {
          resumeTimer()
        }
      }}
      onAnimationEnd={onAnimationEnd}
    >
      <span className={popolaClass.toastIcon}>
        <ToastIcon variant={item.variant} />
      </span>
      <span className={popolaClass.toastMessage}>{item.message}</span>
      <button
        type="button"
        className={popolaClass.toastDismiss}
        aria-label={props.dismissLabel}
        title={props.dismissLabel}
        onClick={beginClose}
      >
        <X size={13} strokeWidth={2} aria-hidden />
      </button>
    </div>
  )
}

export function ToastProvider(props: {
  children?: ReactNode
  dismissLabel?: string
  /** Max concurrent toasts; older ones are dropped. Default 5. */
  max?: number
  theme?: PopolaTheme
  /** Lets a host store call toast outside React. */
  onReady?: (api: ToastApi | null) => void
}) {
  const portalTheme = usePortalTheme(props.theme)
  const [items, setItems] = useState<ToastItem[]>([])
  const max = props.max ?? 5
  const dismissLabel = props.dismissLabel ?? "Dismiss"

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const show = useCallback(
    (message: string, options?: ShowToastOptions) => {
      const trimmed = message.trim()
      if (!trimmed) return ""
      const id = options?.id?.trim() || nextToastId()
      const variant = options?.variant ?? "info"
      const duration =
        options?.duration === undefined ? DEFAULT_TOAST_DURATION_MS : options.duration
      setItems((current) => {
        const without = current.filter((item) => item.id !== id)
        const next = [...without, { id, message: trimmed, variant, duration }]
        return next.length > max ? next.slice(next.length - max) : next
      })
      return id
    },
    [max],
  )

  const api = useMemo((): ToastApi => ({ show, dismiss, clear }), [show, dismiss, clear])

  const viewport =
    items.length > 0
      ? createPortal(
          <div
            className={popolaClass.toastViewport}
            data-popola-theme={portalTheme}
            aria-live="polite"
          >
            {items.map((item) => (
              <ToastCard
                key={item.id}
                item={item}
                dismissLabel={dismissLabel}
                onDismiss={dismiss}
              />
            ))}
          </div>,
          document.body,
        )
      : null

  useEffect(() => {
    props.onReady?.(api)
    return () => props.onReady?.(null)
  }, [api, props.onReady])

  return (
    <ToastContext.Provider value={api}>
      {props.children}
      {viewport}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext)
  if (!api) {
    throw new Error("useToast must be used within a ToastProvider.")
  }
  return api
}
