/**
 * Class names are part of the public contract.
 *
 * The stylesheet in `popola-ui/styles.css` targets these names and nothing else,
 * so a renderer in any framework produces the same look by using the same
 * strings. Two rules keep that true:
 *
 * 1. Styles depend on class names only — never on DOM shape. No descendant or
 *    child selectors that assume a particular nesting. A renderer is free to
 *    wrap things differently.
 * 2. Names are stable. Renaming one is a breaking change for every host that
 *    styled around it.
 */
export const popolaClass = {
  shell: "popola-shell",
  shellHeader: "popola-shell__header",
  shellBody: "popola-shell__body",
  shellMain: "popola-shell__main",
  shellSidebar: "popola-shell__sidebar",
  shellFooter: "popola-shell__footer",

  conversation: "popola-conversation",
  conversationScroll: "popola-conversation__scroll",
  conversationEmpty: "popola-conversation__empty",

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

  composer: "popola-composer",
  composerContext: "popola-composer__context",
  composerInput: "popola-composer__input",
  composerActions: "popola-composer__actions",
  composerButton: "popola-composer__button",
  composerSend: "popola-composer__button--send",
  composerStop: "popola-composer__button--stop",

  permission: "popola-permission",
  permissionLayer: "popola-permission-layer",
  permissionTitle: "popola-permission__title",
  permissionResources: "popola-permission__resources",
  permissionActions: "popola-permission__actions",

  button: "popola-button",
  buttonPrimary: "popola-button--primary",
  buttonGhost: "popola-button--ghost",
} as const

export type PopolaClassName = (typeof popolaClass)[keyof typeof popolaClass]
