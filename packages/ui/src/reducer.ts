import type { AgentEvent } from "popola-protocol"
import type { Attachment, PopolaState } from "./state"

/**
 * Events that belong to the UI, not to the agent contract.
 *
 * The composer is local to the renderer; an agent never touches it.
 */
export type PopolaUiEvent =
  | { type: "composer.text"; text: string }
  | { type: "composer.attachmentAdded"; attachment: Attachment }
  | { type: "composer.attachmentRemoved"; id: string }
  | { type: "composer.cleared" }
  | { type: "reset" }

/**
 * Closed event set; the reducer is a pure function over it.
 *
 * `AgentEvent` carries everything an agent adapter produces. `PopolaUiEvent`
 * adds the composer. The run status is derived from the turn lifecycle rather
 * than set on its own, so there is exactly one source of truth for it.
 */
export type PopolaEvent = AgentEvent | PopolaUiEvent

export const initialState: PopolaState = {
  status: "idle",
  messages: [],
  permissions: [],
  composer: { text: "", attachments: [] },
}

/**
 * Pure: no mutation, I/O or clocks. Returns the same object on a no-op event,
 * so renderers can skip work by comparing snapshots by identity.
 */
export function reduce(state: PopolaState, event: PopolaEvent): PopolaState {
  switch (event.type) {
    case "session.snapshot": {
      const { snapshot } = event
      return {
        ...state,
        status: snapshot.status,
        messages: snapshot.messages,
        permissions: snapshot.permissions,
        error: snapshot.error,
        usage: snapshot.usage,
        plan: snapshot.plan,
        model: snapshot.model,
        modeID: snapshot.modeID,
      }
    }

    case "session.started": {
      return state
    }

    case "turn.started": {
      if (state.status === "busy") return state
      return { ...state, status: "busy" }
    }

    case "turn.completed": {
      if (state.status === "idle") return state
      return { ...state, status: "idle", error: undefined }
    }

    case "turn.canceled": {
      if (state.status === "idle") return state
      return { ...state, status: "idle" }
    }

    case "turn.failed": {
      return { ...state, status: "error", error: event.error }
    }

    case "message.started": {
      if (state.messages.some((message) => message.id === event.message.id)) return state
      return { ...state, messages: [...state.messages, event.message] }
    }

    case "message.part": {
      const index = state.messages.findIndex((message) => message.id === event.messageID)
      if (index < 0) return state
      const message = state.messages[index]
      if (!message) return state

      const partIndex = message.parts.findIndex((part) => part.id === event.part.id)
      if (partIndex < 0) {
        const messages = state.messages.slice()
        messages[index] = { ...message, parts: [...message.parts, event.part] }
        return { ...state, messages }
      }

      if (message.parts[partIndex] === event.part) return state
      const parts = message.parts.slice()
      parts[partIndex] = event.part
      const messages = state.messages.slice()
      messages[index] = { ...message, parts }
      return { ...state, messages }
    }

    case "message.removed": {
      const messages = state.messages.filter((message) => message.id !== event.messageID)
      if (messages.length === state.messages.length) return state
      return { ...state, messages }
    }

    case "permission.requested": {
      if (state.permissions.some((request) => request.id === event.request.id)) return state
      return { ...state, permissions: [...state.permissions, event.request] }
    }

    case "permission.resolved": {
      const permissions = state.permissions.filter((request) => request.id !== event.id)
      if (permissions.length === state.permissions.length) return state
      return { ...state, permissions }
    }

    case "usage": {
      return { ...state, usage: event.usage }
    }

    case "plan": {
      return { ...state, plan: event.entries }
    }

    case "model.changed": {
      if (state.model === event.model) return state
      return { ...state, model: event.model }
    }

    case "mode.changed": {
      if (state.modeID === event.modeID) return state
      return { ...state, modeID: event.modeID }
    }

    case "composer.text": {
      if (state.composer.text === event.text) return state
      return { ...state, composer: { ...state.composer, text: event.text } }
    }

    case "composer.attachmentAdded": {
      if (state.composer.attachments.some((item) => item.id === event.attachment.id)) return state
      return {
        ...state,
        composer: { ...state.composer, attachments: [...state.composer.attachments, event.attachment] },
      }
    }

    case "composer.attachmentRemoved": {
      const attachments = state.composer.attachments.filter((item) => item.id !== event.id)
      if (attachments.length === state.composer.attachments.length) return state
      return { ...state, composer: { ...state.composer, attachments } }
    }

    case "composer.cleared": {
      if (state.composer.text === "" && state.composer.attachments.length === 0) return state
      return { ...state, composer: { text: "", attachments: [] } }
    }

    case "reset": {
      return initialState
    }
  }
}
