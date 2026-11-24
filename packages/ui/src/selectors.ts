import type { AgentSnapshot } from "popola-protocol"
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

/** Agent state for a client joining mid-run; the composer is excluded. */
export function selectSnapshot(state: PopolaState): AgentSnapshot {
  return {
    status: state.status,
    messages: state.messages,
    permissions: state.permissions,
    error: state.error,
    usage: state.usage,
    plan: state.plan,
    model: state.model,
    modeID: state.modeID,
  }
}
