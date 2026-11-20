import type { Message, PopolaState } from "../state"

export function selectMessages(state: PopolaState): Message[] {
  return state.messages
}
