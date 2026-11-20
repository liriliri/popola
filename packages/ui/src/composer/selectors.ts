import type { PopolaState } from "../state"

/** Sending stays available while the agent runs — that is how steering works. */
export function selectCanSend(state: PopolaState): boolean {
  return state.composer.text.trim().length > 0 || state.composer.attachments.length > 0
}
