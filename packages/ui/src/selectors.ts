import type { PopolaState } from "./state"

/**
 * Selectors are plain functions over the state.
 *
 * They do not memoise — that is the renderer's job, with whatever primitive
 * its framework offers. Keeping them pure means one implementation serves
 * every framework, and a renderer only recomputes the slice it actually reads.
 */

export { selectMessages } from "./conversation/selectors"
export { selectCanSend } from "./composer/selectors"
export { selectPermissions } from "./permission/selectors"

/** True while a run is in flight. Stopping is available for that same window. */
export function selectIsBusy(state: PopolaState): boolean {
  return state.status === "busy"
}

export const selectCanStop = selectIsBusy

export function selectError(state: PopolaState): string | undefined {
  return state.error
}
