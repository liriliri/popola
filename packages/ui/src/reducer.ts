import type {
  Attachment,
  Message,
  Part,
  PermissionRequest,
  PopolaState,
  PopolaStatus,
} from "./state"

/**
 * Every change to the state arrives as one of these events.
 *
 * The event set is closed on purpose: the reducer below is a pure function over
 * it, so the state can be replayed, snapshotted and reasoned about without a
 * running agent.
 */
export type PopolaEvent =
  | { type: "message.started"; message: Message }
  /** Upserts a part by id inside the message, so streaming text can replace its own part. */
  | { type: "message.part"; messageID: string; part: Part }
  | { type: "message.removed"; messageID: string }
  | { type: "permission.requested"; request: PermissionRequest }
  | { type: "permission.resolved"; id: string }
  | { type: "composer.text"; text: string }
  | { type: "composer.attachmentAdded"; attachment: Attachment }
  | { type: "composer.attachmentRemoved"; id: string }
  | { type: "composer.cleared" }
  | { type: "status"; status: PopolaStatus }
  | { type: "failed"; message: string }
  | { type: "reset" }

export const initialState: PopolaState = {
  status: "idle",
  messages: [],
  permissions: [],
  composer: { text: "", attachments: [] },
}

/**
 * The one place state changes.
 *
 * Pure: no mutation of the input, no I/O, no clocks. It returns the *same*
 * object when an event changes nothing, so a renderer comparing snapshots by
 * identity can skip the work entirely.
 */
export function reduce(state: PopolaState, event: PopolaEvent): PopolaState {
  switch (event.type) {
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

    case "status": {
      if (state.status === event.status) return state
      return { ...state, status: event.status }
    }

    case "failed": {
      return { ...state, status: "error", error: event.message }
    }

    case "reset": {
      return initialState
    }
  }
}
