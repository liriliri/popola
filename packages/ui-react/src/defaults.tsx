import { popolaClass, type Message, type Part, type PermissionDecision, type PermissionRequest, type ToolCall } from "popola-ui"
import { cn } from "./cn.js"
import { Slot } from "./slot.js"
import { PopolaStreamingText } from "./streaming.js"
import type { PopolaSlots } from "./context.js"

/**
 * The built-in renderings.
 *
 * Each one is a plain component a host can reuse directly, or replace through
 * the matching slot.
 */

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

/**
 * A tool call: one collapsible row.
 *
 * The row always shows what ran, the argument summary and whether it is still
 * running or failed. The panel below holds the request and the result.
 */
export function DefaultToolCall(props: { call: ToolCall }) {
  const { call } = props

  const running = call.status === "running" || call.status === "pending"
  const failed = call.status === "error"
  const summary = summarizeInput(call.input)
  const request = formatInput(call.input)
  const result = call.error ?? call.output

  return (
    <details
      className={cn(
        popolaClass.toolCall,
        running ? popolaClass.toolCallRunning : undefined,
        failed ? popolaClass.toolCallError : undefined,
      )}
    >
      <summary className={popolaClass.toolCallTrigger}>
        <span className={popolaClass.toolCallIcon}>{running ? <SpinnerIcon /> : <ChevronIcon />}</span>
        <span
          className={cn(
            popolaClass.toolCallLabel,
            running ? popolaClass.toolCallLabelRunning : undefined,
          )}
        >
          {call.title ?? call.name}
        </span>
        {summary ? <span className={popolaClass.toolCallQuery}>{summary}</span> : null}
        <span
          className={cn(
            popolaClass.toolCallStatus,
            failed ? popolaClass.toolCallStatusError : undefined,
          )}
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

  switch (part.type) {
    case "text":
      return (
        <Slot
          name="conversation.part.text"
          slotProps={{ text: part.text, streaming: props.streaming ?? false }}
          local={slots}
          fallback={<PopolaStreamingText text={part.text} streaming={props.streaming} />}
        />
      )

    case "reasoning":
      return (
        <Slot
          name="conversation.reasoning"
          slotProps={{ text: part.text }}
          local={slots}
          fallback={<div className={popolaClass.reasoning}>{part.text}</div>}
        />
      )

    case "tool":
      return (
        <Slot
          name={`conversation.tool.${part.call.name}`}
          base="conversation.tool"
          slotProps={{ call: part.call }}
          local={slots}
          fallback={<DefaultToolCall call={part.call} />}
        />
      )

    case "attachment":
      return (
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

    case "error":
      return (
        <Slot
          name="conversation.error"
          slotProps={{ message: part.message }}
          local={slots}
          fallback={<div className={popolaClass.error}>{part.message}</div>}
        />
      )
  }
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

  return (
    <div className={cn(popolaClass.message, roleClass)}>
      {isUser ? null : <div className={popolaClass.messageRole}>{message.role}</div>}
      <div className={cn(popolaClass.card, isUser ? popolaClass.bubble : undefined)}>
        {message.parts.map((part) => (
          <DefaultPart key={part.id} part={part} slots={slots} streaming={props.streaming} />
        ))}
      </div>
    </div>
  )
}

/* ── permission ───────────────────────────────────────────────────────────── */

export function DefaultPermission(props: {
  requests: PermissionRequest[]
  onReply: (id: string, decision: PermissionDecision) => void
}) {
  return (
    <div className={popolaClass.permissionLayer}>
      {props.requests.map((request) => (
        <div key={request.id} className={popolaClass.permission}>
          <div className={popolaClass.permissionTitle}>{request.title}</div>
          <div className={popolaClass.permissionResources}>{request.resources.join("\n")}</div>
          <div className={popolaClass.permissionActions}>
            <button
              className={cn(popolaClass.button, popolaClass.buttonPrimary)}
              onClick={() => props.onReply(request.id, "once")}
            >
              Allow once
            </button>
            <button className={popolaClass.button} onClick={() => props.onReply(request.id, "always")}>
              Always allow
            </button>
            <button
              className={cn(popolaClass.button, popolaClass.buttonGhost)}
              onClick={() => props.onReply(request.id, "reject")}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
