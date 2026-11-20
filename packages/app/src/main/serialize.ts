import type { AgentMessage } from "@earendil-works/pi-agent-core"
import type { Message, Part, ToolStatus } from "popola-ui"

function textOf(content: string | ReadonlyArray<{ type: string; text?: string }>): string {
  if (typeof content === "string") return content
  return content
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text)
    .join("\n")
}

function toolStatus(hasResult: boolean, isError: boolean, running: boolean): ToolStatus {
  if (isError) return "error"
  if (hasResult) return "completed"
  return running ? "running" : "pending"
}

/**
 * Fold pi's transcript into popola messages.
 *
 * Tool results stay on the assistant tool card. The in-flight assistant message
 * is appended when it is not already in the transcript.
 */
export function serializeMessages(
  messages: AgentMessage[],
  streaming: AgentMessage | null | undefined,
  running: boolean,
  notice: string | null,
): Message[] {
  const results = new Map<string, { text: string; isError: boolean }>()
  for (const message of messages) {
    if (message.role !== "toolResult") continue
    results.set(message.toolCallId, {
      text: textOf(message.content),
      isError: message.isError === true,
    })
  }

  const list = streaming ? [...messages.filter((message) => message !== streaming), streaming] : messages
  const out: Message[] = []

  for (let index = 0; index < list.length; index++) {
    const message = list[index]
    if (!message) continue

    if (message.role === "user") {
      const id = `user-${index}-${message.timestamp}`
      out.push({
        id,
        role: "user",
        createdAt: message.timestamp,
        parts: [{ id: `${id}:text`, type: "text", text: textOf(message.content) }],
      })
      continue
    }

    if (message.role !== "assistant") continue

    const id = `assistant-${index}-${message.timestamp}`
    const parts: Part[] = []
    let block = 0
    for (const part of message.content) {
      if (part.type === "text") {
        if (!part.text) continue
        parts.push({ id: `${id}:text:${block}`, type: "text", text: part.text })
      } else if (part.type === "thinking") {
        if (!part.thinking) continue
        parts.push({ id: `${id}:think:${block}`, type: "reasoning", text: part.thinking })
      } else if (part.type === "toolCall") {
        const result = results.get(part.id)
        parts.push({
          id: `${id}:tool:${part.id}`,
          type: "tool",
          call: {
            id: part.id,
            name: part.name,
            status: toolStatus(result !== undefined, result?.isError === true, running),
            input: part.arguments ?? {},
            output: result && !result.isError ? result.text : undefined,
            error: result?.isError ? result.text : undefined,
          },
        })
      }
      block += 1
    }

    if (message.stopReason === "error" && message.errorMessage) {
      parts.push({ id: `${id}:error`, type: "error", message: message.errorMessage })
    }

    out.push({ id, role: "assistant", createdAt: message.timestamp, parts })
  }

  if (notice) {
    out.push({
      id: "host-error",
      role: "assistant",
      parts: [{ id: "host-error:error", type: "error", message: notice }],
    })
  }

  return out
}
