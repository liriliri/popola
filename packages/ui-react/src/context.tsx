import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  createStore,
  resolvePopolaLabels,
  type Attachment,
  type PermissionDecision,
  type PopolaLabels,
  type PopolaStore,
  type SlotName,
} from "popola-ui"

export type { PopolaLabels } from "popola-ui"
export { DEFAULT_POPOLA_LABELS } from "popola-ui"

/** Slot implementations; prop types come from `SlotProps` in `popola-ui`. */
export type PopolaSlots = Partial<Record<SlotName, React.ComponentType<any>>>

export type PopolaSendPayload = {
  readonly text: string
  readonly attachments: Attachment[]
}

/** Schemes shipped by `popola-ui` (`data-popola-theme`). Hosts may add more in their CSS. */
export type PopolaThemeName = "light" | "dark"

/** Preference: built-in scheme, OS-following, or a host-defined scheme name. */
export type PopolaTheme = PopolaThemeName | "system" | (string & {})

export type PopolaThemeOption = {
  value: PopolaTheme
  label: string
}

/** Built-in picker entries — hosts append their own schemes beside these. */
export const POPOLA_THEME_OPTIONS: readonly PopolaThemeOption[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const

export type PopolaContextValue = {
  readonly store: PopolaStore
  readonly slots: PopolaSlots
  readonly theme: PopolaTheme
  readonly labels: PopolaLabels
  readonly onSend?: (payload: PopolaSendPayload) => void
  readonly onStop?: () => void
  readonly onPermissionReply?: (id: string, decision: PermissionDecision) => void
}

const PopolaContext = createContext<PopolaContextValue | undefined>(undefined)

/** Resolved theme for body portals; falls back to system outside a provider. */
export function usePortalTheme(override?: PopolaTheme): string {
  const value = useContext(PopolaContext)
  return useResolvedTheme(override ?? value?.theme ?? "system")
}

export function PopolaProvider(props: {
  /** Bring your own store, or let the provider make one. */
  store?: PopolaStore
  /** Slots available to every component under this provider. */
  slots?: PopolaSlots
  theme?: PopolaTheme
  /** Override built-in chrome copy (placeholder, empty state, permission buttons, …). */
  labels?: Partial<PopolaLabels>
  onSend?: (payload: PopolaSendPayload) => void
  onStop?: () => void
  onPermissionReply?: (id: string, decision: PermissionDecision) => void
  children?: ReactNode
}) {
  const store = useMemo(() => props.store ?? createStore(), [props.store])
  const labels = useMemo(() => resolvePopolaLabels(props.labels), [props.labels])

  const value = useMemo<PopolaContextValue>(
    () => ({
      store,
      slots: props.slots ?? {},
      theme: props.theme ?? "system",
      labels,
      onSend: props.onSend,
      onStop: props.onStop,
      onPermissionReply: props.onPermissionReply,
    }),
    [store, props.slots, props.theme, labels, props.onSend, props.onStop, props.onPermissionReply],
  )

  return <PopolaContext.Provider value={value}>{props.children}</PopolaContext.Provider>
}

export function usePopola(): PopolaContextValue {
  const value = useContext(PopolaContext)
  if (!value) throw new Error("popola components must be rendered inside <PopolaProvider>")
  return value
}

/**
 * Resolves `system` against the OS (and follows changes); other names pass
 * through unchanged. Returns a concrete name for `data-popola-theme`.
 */
export function useResolvedTheme(theme: PopolaTheme): string {
  const [system, setSystem] = useState<PopolaThemeName>(() => {
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

  if (theme === "system") return system
  return theme
}
