import { readFile, writeFile } from "node:fs/promises"
import { initialState, reduce, selectSnapshot } from "popola-ui"
import type { AgentEvent, PermissionDecision, PopolaState } from "popola-ui"
import isErr from "licia/isErr"
import rtrim from "licia/rtrim"
import { createPiSession, type PiSession } from "./adapters/pi"
import { listPiSessions } from "./sessions"
import { WorkspaceStore } from "./workspaceStore"
import type {
  HostEvent,
  ProviderConfig,
  WorkspaceResult,
  WorkspaceState,
} from "../shared/types"

const NOTICE_ID = "host-notice"

/**
 * Owns the agent session and mirrors its state.
 *
 * The mirror exists so a renderer that joins mid-run can be handed a
 * `session.snapshot` instead of the whole event history.
 *
 * Holds a `PiSession` (not bare `AgentSession`) because this private host
 * needs the Pi JSONL path and initial snapshot when opening chats.
 */
export class AgentHost {
  private session: PiSession | null = null
  private state: PopolaState = initialState
  private config: ProviderConfig | null = null
  private readonly listeners = new Set<(event: HostEvent) => void>()
  /** Counts recreations, so a losing one can drop its session. */
  private generation = 0
  private readonly workspace: WorkspaceStore

  constructor(workspaceFile: string, private readonly providerFile: string) {
    this.workspace = new WorkspaceStore(workspaceFile)
  }

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

  async getWorkspace(): Promise<WorkspaceState> {
    const data = this.workspace.get()
    const sessions = data.cwd ? await listPiSessions(data.cwd) : []
    return {
      cwd: data.cwd,
      sessionFile: data.sessionFile,
      recent: data.recent,
      sessions,
    }
  }

  async load(): Promise<void> {
    await this.workspace.load()
    let raw: string
    try {
      raw = await readFile(this.providerFile, "utf8")
    } catch {
      return
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return
    }
    const config = parseProvider(parsed)
    if (!config) return
    this.config = config
    const data = this.workspace.get()
    if (data.cwd && data.sessionFile) {
      const result = await this.openSession(data.sessionFile)
      if (!result.ok) await this.workspace.setSession(null)
    }
  }

  async setProvider(input: unknown): Promise<string | null> {
    const config = parseProvider(input)
    if (!config) return "Fill in the provider, base URL, API key, and model."
    await writeFile(this.providerFile, JSON.stringify(config), { mode: 0o600 })
    this.config = config
    const data = this.workspace.get()
    if (data.sessionFile && data.cwd) {
      await this.openSession(data.sessionFile)
    } else {
      this.closeSession()
    }
    return null
  }

  async setCwd(cwd: string): Promise<WorkspaceResult> {
    await this.workspace.setCwd(cwd)
    this.closeSession()
    return { ok: true, workspace: await this.getWorkspace() }
  }

  async newSession(): Promise<WorkspaceResult> {
    const data = this.workspace.get()
    if (!data.cwd) return { ok: false, error: "Pick a working directory first." }
    if (!this.config) return { ok: false, error: "Save a provider before starting a chat." }
    try {
      await this.recreate({ cwd: data.cwd })
    } catch (error) {
      return { ok: false, error: errorText(error) }
    }
    await this.workspace.setSession(this.session?.sessionFile ?? null)
    return { ok: true, workspace: await this.getWorkspace() }
  }

  async openSession(sessionFile: string): Promise<WorkspaceResult> {
    const data = this.workspace.get()
    if (!data.cwd) return { ok: false, error: "Pick a working directory first." }
    if (!this.config) return { ok: false, error: "Save a provider before opening a chat." }
    try {
      await this.recreate({ cwd: data.cwd, sessionFile })
    } catch (error) {
      return { ok: false, error: errorText(error) }
    }
    await this.workspace.setSession(sessionFile)
    return { ok: true, workspace: await this.getWorkspace() }
  }

  async prompt(text: string): Promise<void> {
    const trimmed = text.trim()
    if (!trimmed) return
    if (!this.session) {
      this.setNotice(
        this.workspace.get().cwd
          ? "Start or open a chat in the sidebar."
          : "Pick a working directory, then start a chat.",
      )
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

  private closeSession(): void {
    this.generation += 1
    this.session?.close()
    this.session = null
    this.state = initialState
    this.handle({ type: "session.snapshot", snapshot: selectSnapshot(initialState) })
  }

  private async recreate(options: { cwd: string; sessionFile?: string }): Promise<void> {
    const generation = ++this.generation
    const config = this.config
    if (!config) {
      this.closeSession()
      return
    }

    const session = createPiSession({
      model: {
        provider: config.provider,
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        model: config.model,
      },
      cwd: options.cwd,
      sessionFile: options.sessionFile,
      askPermission: true,
    })

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

    this.handle({ type: "session.snapshot", snapshot: session.initialSnapshot() })
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
