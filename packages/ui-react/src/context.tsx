import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { createStore, type Attachment, type PermissionDecision, type PopolaStore, type SlotName } from "popola-ui"

/**
 * A slot implementation. The props it receives are fixed by `SlotProps` in
 * `popola-ui`, so a host can write one without reading the renderer's source.
 */
export type PopolaSlotComponent = React.ComponentType<never>

export type PopolaSlots = Partial<Record<SlotName, React.ComponentType<any>>>

export type PopolaSendPayload = {
  readonly text: string
  readonly attachments: Attachment[]
}

export type PopolaTheme = "light" | "dark" | "system"

export type PopolaContextValue = {
  readonly store: PopolaStore
  readonly slots: PopolaSlots
  readonly theme: PopolaTheme
  readonly onSend?: (payload: PopolaSendPayload) => void
  readonly onStop?: () => void
  readonly onPermissionReply?: (id: string, decision: PermissionDecision) => void
}

const PopolaContext = createContext<PopolaContextValue | undefined>(undefined)

export function PopolaProvider(props: {
  /** Bring your own store, or let the provider make one. */
  store?: PopolaStore
  /** Slots available to every component under this provider. */
  slots?: PopolaSlots
  theme?: PopolaTheme
  onSend?: (payload: PopolaSendPayload) => void
  onStop?: () => void
  onPermissionReply?: (id: string, decision: PermissionDecision) => void
  children?: ReactNode
}) {
  const store = useMemo(() => props.store ?? createStore(), [props.store])

  const value = useMemo<PopolaContextValue>(
    () => ({
      store,
      slots: props.slots ?? {},
      theme: props.theme ?? "system",
      onSend: props.onSend,
      onStop: props.onStop,
      onPermissionReply: props.onPermissionReply,
    }),
    [store, props.slots, props.theme, props.onSend, props.onStop, props.onPermissionReply],
  )

  return <PopolaContext.Provider value={value}>{props.children}</PopolaContext.Provider>
}

export function usePopola(): PopolaContextValue {
  const value = useContext(PopolaContext)
  if (!value) throw new Error("popola components must be rendered inside <PopolaProvider>")
  return value
}

/**
 * Resolves "system" against the OS preference and keeps following it.
 *
 * Returns the concrete scheme, so the caller can put it on the DOM as
 * `data-popola-theme` and let the stylesheet switch.
 */
export function useResolvedTheme(theme: PopolaTheme): "light" | "dark" {
  const [system, setSystem] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light"
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  })

  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return
    const query = window.matchMedia("(prefers-color-scheme: dark)")
    const update = () => setSystem(query.matches ? "dark" : "light")
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [theme])

  if (theme === "light" || theme === "dark") return theme
  return system
}
