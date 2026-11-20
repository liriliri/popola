import { readFile, writeFile } from "node:fs/promises"
import type { AgentTool } from "@earendil-works/pi-agent-core"
import { Agent } from "@earendil-works/pi-agent-core"
import type { Model } from "@earendil-works/pi-ai"
import {
  createBashToolDefinition,
  createEditToolDefinition,
  createReadToolDefinition,
  createWriteToolDefinition,
} from "@earendil-works/pi-coding-agent"
import isErr from "licia/isErr"
import rtrim from "licia/rtrim"
import type { HostEvent, ProviderConfig } from "../shared/types"
import { serializeMessages } from "./serialize"

const SYSTEM_PROMPT = `You are a coding assistant running inside the Popola test app.
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

function createModel(config: ProviderConfig): Model<"openai-completions"> {
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

function errorText(error: unknown): string {
  return isErr(error) && error.message ? error.message : "The request failed."
}

export class AgentHost {
  private agent: Agent | null = null
  private unsubscribe: (() => void) | null = null
  private config: ProviderConfig | null = null
  private running = false
  private notice: string | null = null
  private readonly listeners = new Set<(event: HostEvent) => void>()

  constructor(
    private readonly cwd: string,
    private readonly file: string,
  ) {}

  onEvent(listener: (event: HostEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  snapshot(): HostEvent[] {
    return [
      { type: "messages", messages: this.messages() },
      { type: "running", running: this.running },
    ]
  }

  getProvider(): ProviderConfig | null {
    return this.config
  }

  async load(): Promise<void> {
    let raw: string
    try {
      raw = await readFile(this.file, "utf8")
    } catch {
      return
    }
    const config = parseProvider(JSON.parse(raw) as unknown)
    if (!config) return
    this.config = config
    this.recreate()
  }

  async setProvider(input: unknown): Promise<string | null> {
    const config = parseProvider(input)
    if (!config) return "Fill in the provider, base URL, API key, and model."
    await writeFile(this.file, JSON.stringify(config), { mode: 0o600 })
    const wasRunning = this.running
    this.config = config
    this.notice = null
    this.recreate()
    if (wasRunning) this.emit({ type: "running", running: false })
    this.emitMessages()
    return null
  }

  async prompt(text: string): Promise<void> {
    const trimmed = text.trim()
    if (!trimmed) return
    if (!this.agent || !this.config) {
      this.notice = "Save a provider before sending."
      this.emitMessages()
      return
    }
    this.notice = null
    try {
      await this.agent.prompt(trimmed)
    } catch (error) {
      this.notice = errorText(error)
      this.running = false
      this.emit({ type: "running", running: false })
      this.emitMessages()
    }
  }

  abort(): void {
    this.agent?.abort()
  }

  private messages() {
    const state = this.agent?.state
    return serializeMessages(
      state?.messages ?? [],
      state?.streamingMessage ?? null,
      this.running,
      this.notice,
    )
  }

  private emit(event: HostEvent): void {
    for (const listener of this.listeners) listener(event)
  }

  private emitMessages(): void {
    this.emit({ type: "messages", messages: this.messages() })
  }

  private recreate(): void {
    if (!this.config) return
    this.agent?.abort()
    this.unsubscribe?.()
    this.running = false

    const config = this.config
    const agent = new Agent({
      initialState: {
        systemPrompt: SYSTEM_PROMPT,
        model: createModel(config),
        thinkingLevel: "off",
        tools: [
          asTool(createReadToolDefinition(this.cwd)),
          asTool(createBashToolDefinition(this.cwd)),
          asTool(createEditToolDefinition(this.cwd)),
          asTool(createWriteToolDefinition(this.cwd)),
        ],
      },
      getApiKey: () => this.config?.apiKey,
    })

    this.unsubscribe = agent.subscribe((event) => {
      if (event.type === "message_start" || event.type === "message_update" || event.type === "message_end") {
        this.emitMessages()
      } else if (event.type === "agent_start") {
        this.running = true
        this.emit({ type: "running", running: true })
      } else if (event.type === "agent_end") {
        this.running = false
        this.emit({ type: "running", running: false })
        this.emitMessages()
      }
    })

    this.agent = agent
  }
}

export function parseProvider(input: unknown): ProviderConfig | null {
  if (!input || typeof input !== "object") return null
  const record = input as Record<string, unknown>
  const provider = typeof record.provider === "string" ? record.provider.trim() : ""
  const model = typeof record.model === "string" ? record.model.trim() : ""
  const apiKey = typeof record.apiKey === "string" ? record.apiKey.trim() : ""
  let baseUrl = typeof record.baseUrl === "string" ? record.baseUrl.trim() : ""
  if (!provider || !model || !apiKey || !baseUrl) return null
  baseUrl = rtrim(baseUrl, "/")
  try {
    const url = new URL(baseUrl)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
  } catch {
    return null
  }
  return { provider, baseUrl, apiKey, model }
}
