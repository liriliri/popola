import { randomUUID } from "node:crypto"
import type { AgentMessage, AgentTool } from "@earendil-works/pi-agent-core"
import { Agent } from "@earendil-works/pi-agent-core"
import type { AssistantMessage, Message as PiMessage, ToolResultMessage } from "@earendil-works/pi-ai"
import type { Model } from "@earendil-works/pi-ai"
import {
  createBashToolDefinition,
  createEditToolDefinition,
  createReadToolDefinition,
  createWriteToolDefinition,
  SessionManager,
} from "@earendil-works/pi-coding-agent"
import isEqual from "licia/isEqual"
import type {
  AgentEvent,
  AgentSession,
  AgentSnapshot,
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
  /** Open an existing Pi JSONL session; omit to create a new one under cwd. */
  readonly sessionFile?: string
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

/** Classify a tool call by meaning, not by vendor. */
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

/** Maps pi's event vocabulary onto `AgentEvent`. */
export class PiSession implements AgentSession {
  readonly provider = "pi"

  private readonly agent: Agent
  private readonly sessions: SessionManager
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
    this.sessions = config.sessionFile
      ? SessionManager.open(config.sessionFile, undefined, config.cwd)
      : SessionManager.create(config.cwd)

    const history = this.sessions.buildSessionContext().messages

    this.agent = new Agent({
      initialState: {
        systemPrompt: config.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
        model: createModel(config.model),
        thinkingLevel: "off",
        messages: history,
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

  /** Absolute path of the Pi JSONL this session writes to. */
  get sessionFile(): string | undefined {
    return this.sessions.getSessionFile()
  }

  /** Snapshot of the persisted transcript, for clients joining mid-run. */
  initialSnapshot(): AgentSnapshot {
    // `agent.state.messages` is the transcript loaded in the constructor —
    // don't call `buildSessionContext()` again.
    return {
      status: "idle",
      messages: convertHistory(this.agent.state.messages),
      permissions: [],
      model: this.agent.state.model?.id,
    }
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
          this.persistMessage(message)
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
          this.persistMessage(message)
          this.updateAssistantMessage(message)
          this.emitUsage(message)
          this.assistantID = null
        } else if (message.role === "toolResult") {
          this.persistMessage(message)
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

  /** Track the streaming id: timestamps could collide within one millisecond. */
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

  /** Skip unchanged parts: the reducer replaces by identity, so equal parts still re-render. */
  private emitPart(messageID: string, part: Part): void {
    if (isEqual(this.emittedParts.get(part.id), part)) return
    this.emittedParts.set(part.id, part)
    this.emit({ type: "message.part", messageID, part })
  }

  private assistantParts(message: PiMessage, messageID: string): Part[] {
    const assistant = message as AssistantMessage
    return mapAssistantBlocks(assistant, messageID, (block) => {
      const previous = this.toolCalls.get(block.id)?.call
      const call: ToolCall = {
        ...previous,
        id: block.id,
        name: block.name,
        status: previous?.status ?? "pending",
        input: block.arguments,
        detail: deriveDetail(block.name, block.arguments),
      }
      this.toolCalls.set(block.id, { messageID, call })
      return call
    })
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

  /** Append to the Pi JSONL. History already on disk is not written again. */
  private persistMessage(message: PiMessage): void {
    try {
      this.sessions.appendMessage(message)
    } catch {
      // A persistence failure must not kill the live turn.
    }
  }
}

type PiToolBlock = { id: string; name: string; arguments: Record<string, unknown> }

/**
 * Maps an assistant message's blocks onto parts, shared by the live stream and
 * the loaded transcript (so part ids stay identical). `resolveToolCall` builds
 * and records each tool call; `index` is the part's position in the result.
 */
function mapAssistantBlocks(
  assistant: AssistantMessage,
  messageID: string,
  resolveToolCall: (block: PiToolBlock, index: number) => ToolCall,
): Part[] {
  const parts: Part[] = []
  for (const [index, block] of assistant.content.entries()) {
    if (block.type === "text") {
      if (!block.text) continue
      parts.push({ id: `${messageID}:text:${index}`, type: "text", text: block.text })
    } else if (block.type === "thinking") {
      if (!block.thinking) continue
      parts.push({ id: `${messageID}:think:${index}`, type: "reasoning", text: block.thinking })
    } else if (block.type === "toolCall") {
      parts.push({
        id: `${messageID}:tool:${block.id}`,
        type: "tool",
        call: resolveToolCall(block, parts.length),
      })
    }
  }
  // A failed/aborted run carries its reason on the message, not in the blocks.
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

/** Maps a Pi transcript onto messages so an opened session paints immediately. */
function convertHistory(messages: readonly AgentMessage[]): Message[] {
  const result: Message[] = []
  const toolOwners = new Map<string, { messageID: string; index: number }>()
  let counter = 0

  for (const message of messages) {
    if (message.role === "user") {
      const id = `user-${counter++}`
      const text = textOf(message.content)
      result.push({
        id,
        role: "user",
        parts: text ? [{ id: `${id}:text`, type: "text", text }] : [],
        createdAt: "timestamp" in message ? Number(message.timestamp) || undefined : undefined,
      })
      continue
    }

    if (message.role === "assistant") {
      const id = `assistant-${counter++}`
      const assistant = message as AssistantMessage
      const parts = mapAssistantBlocks(assistant, id, (block, index) => {
        const call: ToolCall = {
          id: block.id,
          name: block.name,
          status: "completed",
          input: block.arguments,
          detail: deriveDetail(block.name, block.arguments),
        }
        toolOwners.set(block.id, { messageID: id, index })
        return call
      })
      result.push({
        id,
        role: "assistant",
        parts,
        createdAt: assistant.timestamp,
      })
      continue
    }

    if (message.role === "toolResult") {
      const tool = message as ToolResultMessage
      const owner = toolOwners.get(tool.toolCallId)
      if (!owner) continue
      const target = result.find((entry) => entry.id === owner.messageID)
      if (!target) continue
      const part = target.parts[owner.index]
      if (!part || part.type !== "tool") continue
      const text = textOf(tool.content)
      const call: ToolCall = {
        ...part.call,
        status: tool.isError ? "error" : "completed",
        output: tool.isError ? undefined : text,
        error: tool.isError ? text : undefined,
      }
      const parts = target.parts.slice()
      parts[owner.index] = { id: part.id, type: "tool", call }
      const replaced = result.findIndex((entry) => entry.id === owner.messageID)
      if (replaced >= 0) {
        result[replaced] = { ...target, parts }
      }
    }
  }

  return result
}

/** Returns a concrete `PiSession` so the host can read its JSONL path / snapshot. */
export function createPiSession(config: PiSessionConfig): PiSession {
  return new PiSession(config)
}

function lastAssistant(messages: readonly PiMessage[]): AssistantMessage | undefined {
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index]
    if (message?.role === "assistant") return message as AssistantMessage
  }
  return undefined
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

/** An "always" grant covers exactly this tool + resource, as shown in the dialog. */
function permissionKey(toolName: string, detail: ToolCallDetail | undefined): string {
  return detail ? `${toolName}:${describeDetail(detail)}` : toolName
}
