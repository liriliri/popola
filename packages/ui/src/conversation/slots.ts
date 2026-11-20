import type { Message } from "../message/state"

export const conversationSlot = {
  conversationEmpty: "conversation.empty",
  message: "conversation.message",
  messageUser: "conversation.message.user",
  messageAssistant: "conversation.message.assistant",
} as const

export type ConversationSlotProps = {
  "conversation.empty": Record<string, never>
  "conversation.message": { message: Message }
  "conversation.message.user": { message: Message }
  "conversation.message.assistant": { message: Message }
}
