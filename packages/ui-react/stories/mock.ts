import type { Message, Part, PopolaRole, ToolCall } from "popola-ui"

/**
 * Story data.
 *
 * Plain domain objects — a card is rendered from a message, not from a store.
 */

export function textPart(id: string, text: string): Part {
  return { id, type: "text", text }
}

export function toolPart(id: string, call: ToolCall): Part {
  return { id, type: "tool", call }
}

export function message(id: string, role: PopolaRole, parts: Part[]): Message {
  return { id, role, parts }
}

export function toolCall(call: Partial<ToolCall> & Pick<ToolCall, "id" | "name">): ToolCall {
  return { status: "completed", ...call }
}

/** The long text an assistant streams while it works. */
export const STREAMING_TEXT =
  "The registry is read in three places: the service loader, the CLI bootstrap, and the desktop bridge. " +
  "I will add a test that covers the loader first, since that is the path every request goes through."
