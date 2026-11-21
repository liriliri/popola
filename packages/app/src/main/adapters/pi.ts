import { randomUUID } from "node:crypto"
import type { AgentTool } from "@earendil-works/pi-agent-core"
import { Agent } from "@earendil-works/pi-agent-core"
import type { AssistantMessage, Message as PiMessage, ToolResultMessage } from "@earendil-works/pi-ai"
import type { Model } from "@earendil-works/pi-ai"
import {
  createBashToolDefinition,
  createEditToolDefinition,
  createReadToolDefinition,
  createWriteToolDefinition,
} from "@earendil-works/pi-coding-agent"
import isEqual from "licia/isEqual"
import type {
  AgentEvent,
  AgentSession,
  AgentSessionFactory,
  Message,
  Part,
  PermissionDecision,
  PermissionRequest,
  ToolCall,
  ToolCallDetail,
} from "popola-protocol"

/** How a pi session reaches its model. */
export type PiModelConfig = {
  readonly provider: string
  readonly baseUrl: string
  readonly apiKey: string
  readonly model: string
}

export type PiSessionConfig = {
  readonly model: PiModelConfig
  /** Working directory the tools are allowed to touch. */
  readonly cwd: string
  readonly systemPrompt?: string
  /** Ask the host before every tool call. Off by default. */
  readonly askPermission?: boolean
}

const DEFAULT_SYSTEM_PROMPT = `You are a coding assistant running inside the popola test app.
You can read, edit, and write files, and run shell commands in the workspace.
Be concise and prefer making concrete code changes when asked.`

function asTool(definition: {
  name: string
  label: string
  description: string
  parameters: AgentTool["parameters"]
  prepareArguments?: AgentTool["prepareArguments"]
  execute: Function
}): AgentTool {
  const execute = definition.execute as (
    toolCallId: string,
    params: unknown,
    signal: AbortSignal | undefined,
    onUpdate: unknown,
    ctx: unknown,
  ) => Promise<Awaited<ReturnType<AgentTool["execute"]>>>

  return {
    name: definition.name,
    label: definition.label,
    description: definition.description,
    parameters: definition.parameters,
    prepareArguments: definition.prepareArguments,
    execute: (toolCallId, params, signal, onUpdate) => execute(toolCallId, params, signal, onUpdate, undefined),
  }
}

function createModel(config: PiModelConfig): Model<"openai-completions"> {
  return {
    id: config.model,
    name: config.model,
    api: "openai-completions",
    provider: config.provider,
    baseUrl: config.baseUrl,
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }
}

function textOf(content: string | ReadonlyArray<{ type: string; text?: string }>): string {
  if (typeof content === "string") return content
  return content
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text)
    .join("\n")
}

function argString(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key]
  return typeof value === "string" ? value : undefined
}

/**
 * Classify a tool call by meaning, so the UI can render it without knowing
 * which agent produced it.
 */
function deriveDetail(name: string, args: Record<string, unknown>): ToolCallDetail | undefined {
  switch (name) {
    case "bash": {
      const command = argString(args, "command")
      return command ? { type: "shell", command } : undefined
    }
    case "read": {
      const filePath = argString(args, "path")
      return filePath ? { type: "read", filePath } : undefined
    }
    case "edit": {
      const filePath = argString(args, "path")
      if (!filePath) return undefined
      return {
        type: "edit",
        filePath,
        oldString: argString(args, "oldText"),
        newString: argString(args, "newText"),
      }
    }
    case "write": {
      const filePath = argString(args, "path")
      return filePath ? { type: "write", filePath } : undefined
    }
    case "grep":
    case "find":
    case "ls": {
      const query = argString(args, "pattern") ?? argString(args, "query")
      return query ? { type: "search", query } : undefined
    }
    default:
      return undefined
  }
}

/**
 * A pi coding agent behind the popola protocol.
 *
 * pi speaks its own event vocabulary; this maps it onto `AgentEvent` so the
 * state core and the renderer never learn that pi is running.
 */
export class PiSession implements AgentSession {
  readonly provider = "pi"

  private readonly agent: Agent
  private readonly listeners = new Set<(event: AgentEvent) => void>()
  /** Tool call id → the message that owns it, and the call as last emitted. */
  private readonly toolCalls = new Map<string, { messageID: string; call: ToolCall }>()
  /** Last part emitted per part id, so unchanged parts are not re-sent. */
  private readonly emittedParts = new Map<string, Part>()
  private readonly pendingPermissions = new Map<string, (decision: PermissionDecision) => void>()
  /** Calls the user granted permanently, keyed by tool and what it touches. */
  private readonly alwaysAllowed = new Set<string>()

  private counter = 0
  private turnCounter = 0
  private turnID: string | null = null
  /** The assistant message currently streaming. Only one streams at a time. */
  private assistantID: string | null = null

  constructor(config: PiSessionConfig) {
    this.agent = new Agent({
      initialState: {
        systemPrompt: config.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
        model: createModel(config.model),
        thinkingLevel: "off",
        tools: [
          asTool(createReadToolDefinition(config.cwd)),
          asTool(createBashToolDefinition(config.cwd)),
          asTool(createEditToolDefinition(config.cwd)),
          asTool(createWriteToolDefinition(config.cwd)),
        ],
      },
      getApiKey: () => config.model.apiKey,
      beforeToolCall: config.askPermission
        ? async (context) => this.askPermission(context.toolCall.name, context.args)
        : undefined,
    })

    this.agent.subscribe((event) => {
      this.handlePiEvent(event)
    })
  }

  subscribe(listener: (event: AgentEvent) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  async prompt(text: string): Promise<void> {
    await this.agent.prompt(text)
  }

  interrupt(): void {
    this.agent.abort()
  }

  respondToPermission(id: string, decision: PermissionDecision): void {
    const resolve = this.pendingPermissions.get(id)
    if (!resolve) return
    this.pendingPermissions.delete(id)
    resolve(decision)
  }

  close(): void {
    this.agent.abort()
    this.listeners.clear()
    this.pendingPermissions.clear()
  }

  private emit(event: AgentEvent): void {
    for (const listener of this.listeners) listener(event)
  }

  private async askPermission(
    toolName: string,
    args: unknown,
  ): Promise<{ block?: boolean; reason?: string } | undefined> {
    const input = (args ?? {}) as Record<string, unknown>
    const detail = deriveDetail(toolName, input)
    const key = permissionKey(toolName, detail)
    // A previous "always" already covers this call, so it needs no prompt.
    if (this.alwaysAllowed.has(key)) return undefined

    const id = randomUUID()
    const request: PermissionRequest = {
      id,
      action: toolName,
      resources: detail ? [describeDetail(detail)] : [],
      title: detail ? describeDetail(detail) : `Run ${toolName}`,
      toolName,
    }

    const decision = await new Promise<PermissionDecision>((resolve) => {
      this.pendingPermissions.set(id, resolve)
      this.emit({ type: "permission.requested", request })
    })

    this.emit({ type: "permission.resolved", id })
    if (decision === "reject") {
      return { block: true, reason: "The user rejected this tool call." }
    }
    if (decision === "always") {
      this.alwaysAllowed.add(key)
    }
    return undefined
  }

  private handlePiEvent(event: {
    type: string
    [key: string]: unknown
  }): void {
    switch (event.type) {
      case "agent_start": {
        this.turnID = `turn-${this.turnCounter++}`
        this.emit({ type: "turn.started", turnID: this.turnID })
        return
      }
      case "agent_end": {
        const turnID = this.turnID ?? `turn-${this.turnCounter++}`
        this.turnID = null
        // `agent_end` carries the messages of this run, so the outcome is read
        // from there rather than from the whole transcript.
        const last = lastAssistant((event["messages"] as PiMessage[] | undefined) ?? [])
        if (last?.stopReason === "aborted") {
          this.emit({ type: "turn.canceled", turnID })
        } else if (last?.stopReason === "error" && last.errorMessage) {
          this.emit({ type: "turn.failed", turnID, error: last.errorMessage })
        } else {
          this.emit({ type: "turn.completed", turnID })
        }
        return
      }
      case "message_start": {
        const message = event["message"] as PiMessage
        if (message.role === "user") {
          this.emitUserMessage(message)
        } else if (message.role === "assistant") {
          this.startAssistantMessage(message)
        }
        return
      }
      case "message_update": {
        const message = event["message"] as PiMessage
        if (message.role === "assistant") this.updateAssistantMessage(message)
        return
      }
      case "message_end": {
        const message = event["message"] as PiMessage
        if (message.role === "assistant") {
          this.updateAssistantMessage(message)
          this.emitUsage(message)
          this.assistantID = null
        } else if (message.role === "toolResult") {
          this.emitToolResult(message)
        }
        return
      }
      case "tool_execution_start": {
        this.emitToolStatus(event["toolCallId"] as string, "running")
        return
      }
      case "tool_execution_end": {
        const isError = event["isError"] === true
        this.emitToolStatus(event["toolCallId"] as string, isError ? "error" : "completed")
        return
      }
      default:
        return
    }
  }

  private emitUserMessage(message: PiMessage): void {
    const id = `user-${this.counter++}`
    const text = textOf(message.content)
    const popola: Message = {
      id,
      role: "user",
      parts: text ? [{ id: `${id}:text`, type: "text", text }] : [],
      createdAt: message.timestamp,
    }
    this.emit({ type: "message.started", message: popola })
  }

  /**
   * Only one assistant message streams at a time, so its id is tracked rather
   * than derived from a timestamp — two messages created in the same
   * millisecond would otherwise collide and the reply would be dropped.
   */
  private startAssistantMessage(message: PiMessage): void {
    const id = `assistant-${this.counter++}`
    this.assistantID = id
    this.emittedParts.clear()
    const parts = this.assistantParts(message, id)
    for (const part of parts) this.emittedParts.set(part.id, part)
    this.emit({
      type: "message.started",
      message: { id, role: "assistant", parts, createdAt: message.timestamp },
    })
  }

  private updateAssistantMessage(message: PiMessage): void {
    const id = this.assistantID
    if (!id) return
    for (const part of this.assistantParts(message, id)) {
      this.emitPart(id, part)
    }
  }

  /** Emits a part only when it actually changed, so the reducer can skip it. */
  private emitPart(messageID: string, part: Part): void {
    const previous = this.emittedParts.get(part.id)
    if (samePart(previous, part)) return
    this.emittedParts.set(part.id, part)
    this.emit({ type: "message.part", messageID, part })
  }

  private assistantParts(message: PiMessage, messageID: string): Part[] {
    const assistant = message as AssistantMessage
    const parts: Part[] = []
    for (const [index, block] of assistant.content.entries()) {
      if (block.type === "text") {
        if (!block.text) continue
        parts.push({ id: `${messageID}:text:${index}`, type: "text", text: block.text })
      } else if (block.type === "thinking") {
        if (!block.thinking) continue
        parts.push({
          id: `${messageID}:think:${index}`,
          type: "reasoning",
          text: block.thinking,
        })
      } else if (block.type === "toolCall") {
        const previous = this.toolCalls.get(block.id)
        const call: ToolCall = {
          ...previous?.call,
          id: block.id,
          name: block.name,
          status: previous?.call.status ?? "pending",
          input: block.arguments,
          detail: deriveDetail(block.name, block.arguments),
        }
        this.toolCalls.set(block.id, { messageID, call })
        parts.push({ id: `${messageID}:tool:${block.id}`, type: "tool", call })
      }
    }
    // A failed or aborted run carries its reason on the message, not in the
    // content blocks, so it needs an explicit part or the UI shows nothing.
    if (
      (assistant.stopReason === "error" || assistant.stopReason === "aborted") &&
      assistant.errorMessage
    ) {
      parts.push({
        id: `${messageID}:error`,
        type: "error",
        message: assistant.errorMessage,
      })
    }
    return parts
  }

  private emitUsage(message: PiMessage): void {
    const assistant = message as AssistantMessage
    const usage = assistant.usage
    if (!usage) return
    this.emit({
      type: "usage",
      usage: {
        inputTokens: usage.input,
        outputTokens: usage.output,
        cacheReadTokens: usage.cacheRead,
        cacheWriteTokens: usage.cacheWrite,
        totalTokens: usage.totalTokens,
        costUsd: usage.cost?.total,
      },
    })
  }

  private emitToolStatus(toolCallId: string, status: "running" | "completed" | "error"): void {
    const entry = this.toolCalls.get(toolCallId)
    if (!entry) return
    const call: ToolCall = { ...entry.call, status }
    this.toolCalls.set(toolCallId, { messageID: entry.messageID, call })
    this.emitPart(entry.messageID, {
      id: `${entry.messageID}:tool:${toolCallId}`,
      type: "tool",
      call,
    })
  }

  private emitToolResult(message: ToolResultMessage): void {
    const toolCallId = message.toolCallId
    const entry = this.toolCalls.get(toolCallId)
    if (!entry) return
    const text = textOf(message.content)
    const call: ToolCall = {
      ...entry.call,
      status: message.isError ? "error" : "completed",
      output: message.isError ? undefined : text,
      error: message.isError ? text : undefined,
    }
    this.toolCalls.set(toolCallId, { messageID: entry.messageID, call })
    this.emitPart(entry.messageID, {
      id: `${entry.messageID}:tool:${toolCallId}`,
      type: "tool",
      call,
    })
  }
}

/**
 * Creates a pi session.
 *
 * Typed by the protocol's factory contract, so a host can hold adapters beside
 * each other and swap one for another without knowing how each is built. The
 * host decides the config; the adapter decides the rest.
 */
export const createPiSession: AgentSessionFactory<PiSessionConfig> = (config) =>
  new PiSession(config)

/** The last assistant message of a run, which carries the outcome. */
function lastAssistant(messages: readonly PiMessage[]): AssistantMessage | undefined {
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index]
    if (message?.role === "assistant") return message as AssistantMessage
  }
  return undefined
}

/**
 * Value comparison for parts, so an unchanged part is not re-sent. The reducer
 * compares by identity, so re-sending an equal part would still replace it.
 */
function samePart(left: Part | undefined, right: Part): boolean {
  if (!left || left.type !== right.type) return false
  switch (left.type) {
    case "text":
      return right.type === "text" && left.text === right.text
    case "reasoning":
      return right.type === "reasoning" && left.text === right.text
    case "error":
      return right.type === "error" && left.message === right.message
    case "attachment":
      return (
        right.type === "attachment" &&
        left.attachment.id === right.attachment.id &&
        left.attachment.name === right.attachment.name &&
        left.attachment.mimeType === right.attachment.mimeType &&
        left.attachment.size === right.attachment.size &&
        left.attachment.url === right.attachment.url
      )
    case "tool": {
      if (right.type !== "tool") return false
      const previous = left.call
      const next = right.call
      return (
        previous.id === next.id &&
        previous.name === next.name &&
        previous.status === next.status &&
        previous.title === next.title &&
        previous.output === next.output &&
        previous.error === next.error &&
        isEqual(previous.input, next.input) &&
        isEqual(previous.detail, next.detail)
      )
    }
  }
}

function describeDetail(detail: ToolCallDetail): string {
  switch (detail.type) {
    case "shell":
      return detail.command
    case "read":
    case "edit":
    case "write":
      return detail.filePath
    case "search":
      return detail.query
    case "fetch":
      return detail.url
  }
}

/**
 * The grant a permanent approval covers: the tool and the one thing it touches,
 * exactly as the dialog showed it. A grant for one command does not cover a
 * different command, and a grant for one file does not cover another.
 */
function permissionKey(toolName: string, detail: ToolCallDetail | undefined): string {
  return detail ? `${toolName}:${describeDetail(detail)}` : toolName
}
