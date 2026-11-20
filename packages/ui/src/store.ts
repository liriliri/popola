import { reduce, initialState, type PopolaEvent } from "./reducer.js"
import type { PopolaState } from "./state.js"

/**
 * The state container every renderer talks to.
 *
 * Deliberately the smallest useful surface: read the snapshot, subscribe to
 * changes, push events. A renderer binds this to its own reactivity primitive
 * in a few lines, which is why the core stays framework-agnostic.
 */
export type PopolaStore = {
  getState(): PopolaState
  subscribe(listener: () => void): () => void
  dispatch(event: PopolaEvent): void
}

export function createStore(initial?: Partial<PopolaState>): PopolaStore {
  let state: PopolaState = initial ? { ...initialState, ...initial } : initialState
  const listeners = new Set<() => void>()

  return {
    getState: () => state,

    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    dispatch(event) {
      const next = reduce(state, event)
      // The reducer returns the same object when nothing changed; skipping the
      // notification keeps subscribers from re-rendering for a no-op event.
      if (next === state) return
      state = next
      for (const listener of listeners) listener()
    },
  }
}
