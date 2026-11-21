import { readFile, writeFile } from "node:fs/promises"
import { initialState, reduce, selectSnapshot } from "popola-ui"
import type { AgentEvent, AgentSession, PermissionDecision, PopolaState } from "popola-ui"
import isErr from "licia/isErr"
import rtrim from "licia/rtrim"
import { createPiSession } from "./adapters/pi"
import type { HostEvent, ProviderConfig } from "../shared/types"

const NOTICE_ID = "host-notice"

/**
 * Owns the agent session and mirrors its state.
 *
 * The mirror exists so a renderer that joins mid-run can be handed a
 * `session.snapshot` instead of the whole event history.
 */
export class AgentHost {
  private session: AgentSession | null = null
  private state: PopolaState = initialState
  private config: ProviderConfig | null = null
  private readonly listeners = new Set<(event: HostEvent) => void>()
  /** Counts recreations, so a losing one can drop its session. */
  private generation = 0

  constructor(
    private readonly cwd: string,
    private readonly file: string,
  ) {}

  onEvent(listener: (event: HostEvent) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** The current state, for a client that connects after the run started. */
  snapshot(): HostEvent {
    return { type: "session.snapshot", snapshot: selectSnapshot(this.state) }
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
    await this.recreate()
  }

  async setProvider(input: unknown): Promise<string | null> {
    const config = parseProvider(input)
    if (!config) return "Fill in the provider, base URL, API key, and model."
    await writeFile(this.file, JSON.stringify(config), { mode: 0o600 })
    this.config = config
    await this.recreate()
    return null
  }

  async prompt(text: string): Promise<void> {
    const trimmed = text.trim()
    if (!trimmed) return
    if (!this.session) {
      this.setNotice("Save a provider before sending.")
      return
    }
    this.setNotice(null)
    try {
      await this.session.prompt(trimmed)
    } catch (error) {
      this.setNotice(errorText(error))
    }
  }

  abort(): void {
    this.session?.interrupt()
  }

  /** Answers an approval prompt the agent raised. */
  respondToPermission(id: string, decision: PermissionDecision): void {
    this.session?.respondToPermission(id, decision)
  }

  /** Applies an event to the mirror and forwards it to every listener. */
  private handle(event: AgentEvent): void {
    this.state = reduce(this.state, event)
    for (const listener of this.listeners) listener(event)
  }

  /** A notice is an assistant message with an error part; clearing removes it. */
  private setNotice(text: string | null): void {
    if (!text) {
      if (!this.state.messages.some((message) => message.id === NOTICE_ID)) return
      this.handle({ type: "message.removed", messageID: NOTICE_ID })
      return
    }
    this.handle({
      type: "message.started",
      message: { id: NOTICE_ID, role: "assistant", parts: [] },
    })
    this.handle({
      type: "message.part",
      messageID: NOTICE_ID,
      part: { id: `${NOTICE_ID}:error`, type: "error", message: text },
    })
  }

  private async recreate(): Promise<void> {
    const generation = ++this.generation
    const config = this.config
    if (!config) {
      this.session?.close()
      this.session = null
      return
    }

    // The session is created through the protocol factory, so the host never
    // depends on which adapter it drives.
    const session = await createPiSession({
      model: {
        provider: config.provider,
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        model: config.model,
      },
      cwd: this.cwd,
      // This app is the test host for the whole chain, approvals included.
      askPermission: true,
    })

    // A newer recreation won while this one was waiting.
    if (generation !== this.generation) {
      session.close()
      return
    }

    const previous = this.session
    this.session = session
    previous?.close()

    this.session.subscribe((event) => {
      this.handle(event)
    })

    // A new session starts with an empty transcript.
    this.handle({ type: "session.snapshot", snapshot: selectSnapshot(initialState) })
  }
}

function errorText(error: unknown): string {
  return isErr(error) && error.message ? error.message : "The request failed."
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
