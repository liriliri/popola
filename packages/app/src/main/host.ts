import { readFile, writeFile } from "node:fs/promises"
import { initialState, reduce, selectSnapshot } from "popola-ui"
import type { AgentEvent, PermissionDecision, PopolaState } from "popola-ui"
import isErr from "licia/isErr"
import rtrim from "licia/rtrim"
import { createPiSession, listPiSessions, type PiSession } from "popola-pi"
import { WorkspaceStore } from "./workspaceStore"
import type {
  HostEvent,
  ListModelsInput,
  ListModelsResult,
  ProviderAccount,
  ProviderConfig,
  WorkspaceResult,
  WorkspaceState,
} from "../shared/types"
import { activeProviderModel } from "../shared/types"

const NOTICE_ID = "host-notice"

/**
 * Owns the agent session and mirrors its state, so a renderer joining mid-run
 * gets a `session.snapshot` instead of the whole event history.
 *
 * Holds a concrete `PiSession`, not `AgentSession`: this private host needs the
 * Pi JSONL path and initial snapshot when opening chats.
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

  /** OpenAI-compatible `GET {baseUrl}/models` — main process avoids CORS. */
  async listModels(input: unknown): Promise<ListModelsResult> {
    const parsed = parseListModelsInput(input)
    if (!parsed) return { ok: false, error: "Enter a valid http(s) base URL first." }
    try {
      const models = await fetchOpenAiCompatibleModels(parsed)
      if (models.length === 0) {
        return { ok: false, error: "The endpoint returned no models." }
      }
      return { ok: true, models }
    } catch (error) {
      return { ok: false, error: errorText(error) }
    }
  }

  async setProvider(input: unknown): Promise<string | null> {
    if (
      input &&
      typeof input === "object" &&
      Array.isArray((input as { accounts?: unknown }).accounts) &&
      (input as { accounts: unknown[] }).accounts.length === 0
    ) {
      await writeFile(this.providerFile, "{}", { mode: 0o600 })
      this.config = null
      this.closeSession()
      return null
    }
    const config = parseProvider(input)
    if (!config) return "Add a provider with a base URL, API key, and at least one model."
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
    if (!this.config) {
      this.setNotice("No provider configured. Open Settings to add one.")
      return
    }
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

    const model = activeProviderModel(config)
    if (!model) {
      this.closeSession()
      return
    }

    const session = createPiSession({
      model,
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

function parseAccount(input: unknown): ProviderAccount | null {
  if (!input || typeof input !== "object") return null
  const record = input as Record<string, unknown>
  const id = typeof record.id === "string" ? record.id.trim() : ""
  const provider = typeof record.provider === "string" ? record.provider.trim() : ""
  const apiKey = typeof record.apiKey === "string" ? record.apiKey.trim() : ""
  let baseUrl = typeof record.baseUrl === "string" ? record.baseUrl.trim() : ""
  const nameRaw = typeof record.name === "string" ? record.name.trim() : ""
  const modelsRaw = Array.isArray(record.models) ? record.models : null
  const models = modelsRaw
    ? modelsRaw.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .map((item) => item.trim())
    : []
  const catalogRaw = Array.isArray(record.catalog) ? record.catalog : null
  const catalog = catalogRaw
    ? [
        ...new Set(
          catalogRaw
            .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
            .map((item) => item.trim()),
        ),
      ]
    : undefined
  if (!id || !provider || !baseUrl || models.length === 0) return null
  baseUrl = rtrim(baseUrl, "/")
  try {
    const url = new URL(baseUrl)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    const host = url.hostname.toLowerCase()
    const local = host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1"
    if (!apiKey && !local) return null
  } catch {
    return null
  }
  return {
    id,
    name: nameRaw || provider,
    provider,
    baseUrl,
    apiKey,
    models: [...new Set(models)],
    ...(catalog && catalog.length > 0 ? { catalog } : {}),
    enabled: record.enabled === false ? false : true,
  }
}

export function parseProvider(input: unknown): ProviderConfig | null {
  if (!input || typeof input !== "object") return null
  const record = input as Record<string, unknown>

  if (Array.isArray(record.accounts)) {
    const accounts = record.accounts
      .map(parseAccount)
      .filter((account): account is ProviderAccount => account !== null)
    if (accounts.length === 0) return null
    const activeAccountId =
      typeof record.activeAccountId === "string" &&
      accounts.some((account) => account.id === record.activeAccountId)
        ? record.activeAccountId
        : accounts[0]!.id
    const active = accounts.find((account) => account.id === activeAccountId) ?? accounts[0]!
    const modelRaw = typeof record.model === "string" ? record.model.trim() : ""
    const model =
      (modelRaw && active.models.includes(modelRaw) ? modelRaw : null) ?? active.models[0]!
    return { accounts, activeAccountId, model }
  }

  // Legacy flat shape → one account.
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
  const account: ProviderAccount = {
    id: provider,
    name: provider,
    provider,
    baseUrl,
    apiKey,
    models: [model],
  }
  return { accounts: [account], activeAccountId: account.id, model }
}

function parseListModelsInput(input: unknown): ListModelsInput | null {
  if (!input || typeof input !== "object") return null
  const record = input as Record<string, unknown>
  let baseUrl = typeof record.baseUrl === "string" ? record.baseUrl.trim() : ""
  if (!baseUrl) return null
  baseUrl = rtrim(baseUrl, "/")
  try {
    const url = new URL(baseUrl)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    if (url.username || url.password) return null
  } catch {
    return null
  }
  const apiKey =
    typeof record.apiKey === "string" && record.apiKey.trim()
      ? record.apiKey.trim()
      : undefined
  return { baseUrl, apiKey }
}

async function fetchOpenAiCompatibleModels(input: ListModelsInput): Promise<string[]> {
  const response = await fetch(`${input.baseUrl}/models`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(input.apiKey ? { Authorization: `Bearer ${input.apiKey}` } : {}),
    },
  })
  const text = await response.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text) as unknown
    } catch {
      body = null
    }
  }
  if (!response.ok) {
    const detail = extractApiErrorMessage(body)
    throw new Error(
      detail
        ? `Could not list models (HTTP ${response.status}): ${detail}`
        : `Could not list models (HTTP ${response.status}).`,
    )
  }
  return parseModelIds(body)
}

function extractApiErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null
  const record = body as Record<string, unknown>
  if (typeof record.error === "string" && record.error.trim()) return record.error.trim()
  if (record.error && typeof record.error === "object") {
    const message = (record.error as { message?: unknown }).message
    if (typeof message === "string" && message.trim()) return message.trim()
  }
  if (typeof record.message === "string" && record.message.trim()) return record.message.trim()
  return null
}

function parseModelIds(body: unknown): string[] {
  if (!body || typeof body !== "object") return []
  const record = body as Record<string, unknown>
  const rows = Array.isArray(record.data)
    ? record.data
    : Array.isArray(record.models)
      ? record.models
      : Array.isArray(body)
        ? body
        : []
  const seen = new Set<string>()
  const out: string[] = []
  for (const row of rows) {
    const id =
      typeof row === "string"
        ? row.trim()
        : row && typeof row === "object" && typeof (row as { id?: unknown }).id === "string"
          ? (row as { id: string }).id.trim()
          : ""
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}
