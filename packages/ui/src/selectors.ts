import type { Message, PermissionRequest, PopolaState } from "./state.js"

/**
 * Selectors are plain functions over the state.
 *
 * They do not memoise — that is the renderer's job, with whatever primitive
 * its framework offers. Keeping them pure means one implementation serves
 * every framework, and a renderer only recomputes the slice it actually reads.
 */

export function selectMessages(state: PopolaState): Message[] {
  return state.messages
}

export function selectPermissions(state: PopolaState): PermissionRequest[] {
  return state.permissions
}

export function selectIsBusy(state: PopolaState): boolean {
  return state.status === "busy"
}

export function selectCanStop(state: PopolaState): boolean {
  return state.status === "busy"
}

/** Sending stays available while the agent runs — that is how steering works. */
export function selectCanSend(state: PopolaState): boolean {
  return state.composer.text.trim().length > 0 || state.composer.attachments.length > 0
}

export function selectError(state: PopolaState): string | undefined {
  return state.error
}
