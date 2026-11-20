import type { ReactNode } from "react"
import { popolaClass, type Message, type Part, type ToolCall } from "popola-ui"
import className from "licia/className"
import { Slot } from "../slot"
import { PopolaMarkdown } from "../markdown"
import { PopolaTypingIndicator } from "./streaming"
import type { PopolaSlots } from "../context"

/** Built-in renderings; hosts can reuse them or replace them via slots. */

/* ── icons ────────────────────────────────────────────────────────────────── */

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={popolaClass.toolCallSpinner} aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

/* ── tool call ────────────────────────────────────────────────────────────── */

/** The argument worth showing next to the tool name — the one a human reads. */
function summarizeInput(input: Record<string, unknown> | undefined): string {
  if (!input) return ""
  for (const key of ["command", "query", "path", "file_path", "url", "pattern", "content"]) {
    const value = input[key]
    if (typeof value === "string" && value.length > 0) return value
  }
  return ""
}

function formatInput(input: Record<string, unknown> | undefined): string {
  if (!input) return ""
  try {
    return JSON.stringify(input, null, 2)
  } catch {
    return ""
  }
}

/** A collapsible tool row: summary always visible, request/result in a panel. */
export function DefaultToolCall(props: { call: ToolCall }) {
  const { call } = props

  const running = call.status === "running" || call.status === "pending"
  const failed = call.status === "error"
  const completed = call.status === "completed"
  const summary = summarizeInput(call.input)
  const request = formatInput(call.input)
  const result = call.error ?? call.output

  return (
    <details
      className={className(popolaClass.toolCall, {
        [popolaClass.toolCallRunning]: running,
        [popolaClass.toolCallCompleted]: completed,
        [popolaClass.toolCallError]: failed,
      })}
    >
      <summary className={popolaClass.toolCallTrigger}>
        <span className={popolaClass.toolCallIcon}>{running ? <SpinnerIcon /> : <ChevronIcon />}</span>
        <span
          className={className(popolaClass.toolCallLabel, {
            [popolaClass.toolCallLabelRunning]: running,
          })}
        >
          {call.title ?? call.name}
        </span>
        {summary ? <span className={popolaClass.toolCallQuery}>{summary}</span> : null}
        <span
          className={className(popolaClass.toolCallStatus, {
            [popolaClass.toolCallStatusError]: failed,
          })}
        >
          {running ? null : failed ? <CrossIcon /> : <CheckIcon />}
        </span>
      </summary>

      {request || result ? (
        <div className={popolaClass.toolCallPanel}>
          {request ? (
            <section className={popolaClass.toolCallSection}>
              <p className={popolaClass.toolCallSectionTitle}>Request</p>
              <pre className={popolaClass.toolCallSectionBody}>{request}</pre>
            </section>
          ) : null}
          {result ? (
            <section className={popolaClass.toolCallSection}>
              <p className={popolaClass.toolCallSectionTitle}>Result</p>
              <pre className={popolaClass.toolCallSectionBody}>{result}</pre>
            </section>
          ) : null}
        </div>
      ) : null}
    </details>
  )
}

/* ── parts ────────────────────────────────────────────────────────────────── */

export function DefaultPart(props: {
  part: Part
  slots?: PopolaSlots
  streaming?: boolean
}) {
  const { part, slots } = props
  let content: ReactNode

  switch (part.type) {
    case "text":
      content = (
        <Slot
          name="conversation.part.text"
          slotProps={{ text: part.text, streaming: props.streaming ?? false }}
          local={slots}
          fallback={<PopolaMarkdown text={part.text} streaming={props.streaming} />}
        />
      )
      break

    case "reasoning":
      content = (
        <Slot
          name="conversation.reasoning"
          slotProps={{ text: part.text }}
          local={slots}
          fallback={<div className={popolaClass.reasoning}>{part.text}</div>}
        />
      )
      break

    case "tool":
      content = (
        <Slot
          name={`conversation.tool.${part.call.name}`}
          base="conversation.tool"
          slotProps={{ call: part.call }}
          local={slots}
          fallback={<DefaultToolCall call={part.call} />}
        />
      )
      break

    case "attachment":
      content = (
        <Slot
          name="conversation.attachment"
          slotProps={{ attachment: part.attachment }}
          local={slots}
          fallback={
            <span className={popolaClass.attachment}>
              <span className={popolaClass.attachmentName}>{part.attachment.name}</span>
            </span>
          }
        />
      )
      break

    case "error":
      content = (
        <Slot
          name="conversation.error"
          slotProps={{ message: part.message }}
          local={slots}
          fallback={<div className={popolaClass.error}>{part.message}</div>}
        />
      )
      break
  }

  return <div className={popolaClass.part}>{content}</div>
}

/* ── message card ─────────────────────────────────────────────────────────── */

export function PopolaCard(props: {
  message: Message
  slots?: PopolaSlots
  /** Reveal the text word by word. The host decides when a message is live. */
  streaming?: boolean
}) {
  const { message, slots } = props

  const isUser = message.role === "user"
  const roleClass = isUser
    ? popolaClass.messageUser
    : message.role === "assistant"
      ? popolaClass.messageAssistant
      : undefined
  // A text part owns its own dots, so the typewriter stays mounted as words arrive.
  const hasTextPart = message.parts.some((part) => part.type === "text")
  const showTyping = props.streaming === true && !hasVisibleContent(message) && !hasTextPart

  return (
    <div className={className(popolaClass.message, roleClass)}>
      {isUser ? null : <div className={popolaClass.messageRole}>{message.role}</div>}
      <div className={className(popolaClass.card, { [popolaClass.bubble]: isUser })}>
        {showTyping ? <PopolaTypingIndicator /> : null}
        {message.parts.map((part) => (
          <DefaultPart key={part.id} part={part} slots={slots} streaming={props.streaming} />
        ))}
      </div>
    </div>
  )
}

function hasVisibleContent(message: Message): boolean {
  return message.parts.some((part) => {
    switch (part.type) {
      case "text":
      case "reasoning":
        return part.text.length > 0
      case "tool":
      case "attachment":
      case "error":
        return true
    }
  })
}
