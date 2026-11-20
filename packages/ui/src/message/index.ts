export type PopolaRole = "user" | "assistant" | "system"

export type ToolStatus = "pending" | "running" | "completed" | "error"

export type ToolCall = {
  readonly id: string
  readonly name: string
  readonly status: ToolStatus
  /** Human-readable label the host may override. */
  readonly title?: string
  readonly input?: Record<string, unknown>
  readonly output?: string
  readonly error?: string
  readonly startedAt?: number
  readonly endedAt?: number
}

export type Attachment = {
  readonly id: string
  readonly name: string
  readonly mimeType?: string
  readonly size?: number
  readonly url?: string
}

export type TextPart = {
  readonly id: string
  readonly type: "text"
  readonly text: string
}

export type ReasoningPart = {
  readonly id: string
  readonly type: "reasoning"
  readonly text: string
}

export type ToolPart = {
  readonly id: string
  readonly type: "tool"
  readonly call: ToolCall
}

export type AttachmentPart = {
  readonly id: string
  readonly type: "attachment"
  readonly attachment: Attachment
}

export type ErrorPart = {
  readonly id: string
  readonly type: "error"
  readonly message: string
}

export type Part = TextPart | ReasoningPart | ToolPart | AttachmentPart | ErrorPart

export type Message = {
  readonly id: string
  readonly role: PopolaRole
  readonly parts: Part[]
  readonly createdAt?: number
}

export const messageClass = {
  message: "popola-message",
  messageUser: "popola-message--user",
  messageAssistant: "popola-message--assistant",
  messageRole: "popola-message__role",

  /** The box itself — a message, a tool result, anything framed. */
  card: "popola-card",
  /** The bubble around a user's message. */
  bubble: "popola-bubble",

  part: "popola-part",

  reasoning: "popola-reasoning",

  /**
   * A tool call. A collapsible row: icon, label, argument summary, status.
   * The summary line is always visible; the panel below holds the request
   * and the result.
   */
  toolCall: "popola-tool-call",
  toolCallTrigger: "popola-tool-call__trigger",
  toolCallIcon: "popola-tool-call__icon",
  toolCallSpinner: "popola-tool-call__spinner",
  toolCallLabel: "popola-tool-call__label",
  toolCallQuery: "popola-tool-call__query",
  toolCallStatus: "popola-tool-call__status",
  toolCallPanel: "popola-tool-call__panel",
  toolCallSection: "popola-tool-call__section",
  toolCallSectionTitle: "popola-tool-call__section-title",
  toolCallSectionBody: "popola-tool-call__section-body",
  toolCallRunning: "popola-tool-call--running",
  toolCallCompleted: "popola-tool-call--completed",
  toolCallError: "popola-tool-call--error",
  toolCallLabelRunning: "popola-tool-call__label--running",
  toolCallStatusError: "popola-tool-call__status--error",

  /** Text that arrives word by word while the agent is generating. */
  streamText: "popola-stream-text",
  streamWord: "popola-stream-text__word",
  streamWordFresh: "popola-stream-text__word--fresh",
  streamCursor: "popola-stream-text__cursor",

  /** Three dots shown while the agent has produced nothing yet. */
  typing: "popola-typing",
  typingDot: "popola-typing__dot",

  diff: "popola-diff",

  attachment: "popola-attachment",
  attachmentName: "popola-attachment__name",

  error: "popola-error",
} as const

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
