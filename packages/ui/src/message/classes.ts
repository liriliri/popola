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
  /**
   * State modifiers that live on the element they style. The stylesheet never
   * reaches down to a child, so a renderer is free to nest differently.
   */
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
