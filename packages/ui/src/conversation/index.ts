import type { Message } from "../message"
import type { PopolaState } from "../state"

export function selectMessages(state: PopolaState): Message[] {
  return state.messages
}

export const conversationClass = {
  conversation: "popola-conversation",
  conversationScroll: "popola-conversation__scroll",
  conversationColumn: "popola-conversation__column",
  conversationEmpty: "popola-conversation__empty",
} as const

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
