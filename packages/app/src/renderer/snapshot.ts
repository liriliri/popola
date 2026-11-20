import type { Message, Part, PopolaStore } from "popola-ui"

function samePart(left: Part | undefined, right: Part): boolean {
  if (!left || left.type !== right.type) return false
  if (left.type === "text" && right.type === "text") return left.text === right.text
  if (left.type === "reasoning" && right.type === "reasoning") return left.text === right.text
  if (left.type === "error" && right.type === "error") return left.message === right.message
  if (left.type === "tool" && right.type === "tool") {
    const previous = left.call
    const next = right.call
    return (
      previous.status === next.status &&
      previous.output === next.output &&
      previous.error === next.error &&
      previous.name === next.name &&
      JSON.stringify(previous.input) === JSON.stringify(next.input)
    )
  }
  return false
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
