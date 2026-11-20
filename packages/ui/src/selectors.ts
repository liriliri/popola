import type { PopolaState } from "./state"

/** Pure state readers; memoisation is the renderer's job. */

export { selectMessages } from "./conversation"
export { selectCanSend } from "./composer"
export { selectPermissions } from "./permission"

/** True while a run is in flight. Stopping is available for that same window. */
export function selectIsBusy(state: PopolaState): boolean {
  return state.status === "busy"
}

export const selectCanStop = selectIsBusy

export function selectError(state: PopolaState): string | undefined {
  return state.error
}
