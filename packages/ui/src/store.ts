import { reduce, initialState, type PopolaEvent } from "./reducer"
import type { PopolaState } from "./state"

/** Minimal state container: read the snapshot, subscribe, push events. */
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
      if (next === state) return
      state = next
      for (const listener of listeners) listener()
    },
  }
}
