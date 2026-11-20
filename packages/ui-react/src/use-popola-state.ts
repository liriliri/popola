import { useCallback, useRef, useSyncExternalStore } from "react"
import type { PopolaState } from "popola-ui"
import { usePopola } from "./context"

/**
 * Reads a slice of the state and re-renders when that slice changes.
 *
 * The snapshot is cached against the state object, and the reducer returns the
 * same object when nothing changed — so an event that does not touch the
 * selected slice never recomputes it, and never re-renders this component.
 *
 * Selectors should return primitives or stable references. Returning a fresh
 * object each time defeats the comparison and re-renders on every store
 * change.
 */
export function usePopolaState<T>(selector: (state: PopolaState) => T): T {
  const store = usePopola().store

  const selectorRef = useRef(selector)
  selectorRef.current = selector

  const cache = useRef<{ state: PopolaState; value: T } | undefined>(undefined)

  const getSnapshot = useCallback(() => {
    const state = store.getState()
    const cached = cache.current
    if (cached && cached.state === state) return cached.value
    const value = selectorRef.current(state)
    cache.current = { state, value }
    return value
  }, [store])

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot)
}
