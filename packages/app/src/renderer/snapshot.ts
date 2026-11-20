import type { Message, Part, PopolaStore } from "popola-ui"

function samePart(left: Part | undefined, right: Part): boolean {
  if (!left || left.type !== right.type) return false
  switch (left.type) {
    case "text":
      return right.type === "text" && left.text === right.text
    case "reasoning":
      return right.type === "reasoning" && left.text === right.text
    case "error":
      return right.type === "error" && left.message === right.message
    case "attachment":
      return (
        right.type === "attachment" &&
        left.attachment.id === right.attachment.id &&
        left.attachment.name === right.attachment.name &&
        left.attachment.mimeType === right.attachment.mimeType &&
        left.attachment.size === right.attachment.size &&
        left.attachment.url === right.attachment.url
      )
    case "tool": {
      if (right.type !== "tool") return false
      const previous = left.call
      const next = right.call
      if (
        previous.status !== next.status ||
        previous.output !== next.output ||
        previous.error !== next.error ||
        previous.name !== next.name ||
        previous.title !== next.title
      ) {
        return false
      }
      // Reference check skips serialising for committed calls; streaming
      // snapshots rebuild `input`, so fall back to a structural compare.
      return (
        previous.input === next.input ||
        JSON.stringify(previous.input) === JSON.stringify(next.input)
      )
    }
  }
}

/** Replace the transcript with a snapshot. The composer is left alone. */
export function applySnapshot(store: PopolaStore, messages: Message[]): void {
  const current = store.getState().messages
  const nextIds = new Set(messages.map((message) => message.id))

  for (const message of current) {
    if (!nextIds.has(message.id)) {
      store.dispatch({ type: "message.removed", messageID: message.id })
    }
  }

  const existingById = new Map(store.getState().messages.map((message) => [message.id, message]))
  for (const message of messages) {
    const existing = existingById.get(message.id)
    if (!existing) {
      store.dispatch({ type: "message.started", message })
      continue
    }
    for (const part of message.parts) {
      const previous = existing.parts.find((item) => item.id === part.id)
      if (samePart(previous, part)) continue
      store.dispatch({ type: "message.part", messageID: message.id, part })
    }
  }
}
