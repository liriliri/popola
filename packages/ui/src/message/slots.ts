import type { Attachment, ToolCall } from "./state"

export const messageSlot = {
  reasoning: "conversation.reasoning",
  partText: "conversation.part.text",
  tool: "conversation.tool",
  attachment: "conversation.attachment",
  error: "conversation.error",
} as const

export type MessageSlotProps = {
  "conversation.reasoning": { text: string }
  "conversation.part.text": { text: string; streaming: boolean }
  "conversation.tool": { call: ToolCall }
  "conversation.attachment": { attachment: Attachment }
  "conversation.error": { message: string }
}
