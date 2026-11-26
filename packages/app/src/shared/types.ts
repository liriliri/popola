import type { AgentEvent, PermissionDecision } from "popola-protocol"

/** One configured AI service (API key + selectable models). */
export type ProviderAccount = {
  id: string
  /** Display name in the composer menu. */
  name: string
  provider: string
  baseUrl: string
  apiKey: string
  /** Enabled for the composer picker. */
  models: string[]
  /** Last fetched available list for the setup dialog. */
  catalog?: string[]
  /** When false, omitted from the composer. */
  enabled?: boolean
}

/**
 * Saved provider state: one or more accounts, with an active account + model.
 * Legacy flat `{ provider, baseUrl, apiKey, model }` files are migrated on read.
 */
export type ProviderConfig = {
  accounts: ProviderAccount[]
  activeAccountId: string
  model: string
}

export type ProviderResult = { ok: true } | { ok: false; error: string }

/** Probe an OpenAI-compatible `{baseUrl}/models` endpoint. */
export type ListModelsInput = {
  baseUrl: string
  apiKey?: string
}

export type ListModelsResult =
  | { ok: true; models: string[] }
  | { ok: false; error: string }

/** Active transport fields for creating a Pi session. */
export type ActiveProviderModel = {
  provider: string
  baseUrl: string
  apiKey: string
  model: string
}

export function accountEnabled(account: ProviderAccount): boolean {
  return account.enabled !== false
}

export function activeProviderAccount(config: ProviderConfig): ProviderAccount | null {
  const preferred =
    config.accounts.find((account) => account.id === config.activeAccountId) ?? null
  if (preferred && accountEnabled(preferred)) return preferred
  return config.accounts.find(accountEnabled) ?? null
}

export function activeProviderModel(config: ProviderConfig): ActiveProviderModel | null {
  const account = activeProviderAccount(config)
  if (!account) return null
  const model =
    account.models.find((id) => id === config.model) ?? account.models[0] ?? config.model
  if (!model) return null
  return {
    provider: account.provider,
    baseUrl: account.baseUrl,
    apiKey: account.apiKey,
    model,
  }
}

/** One popola-managed chat under a project. */
export type SessionSummary = {
  id: string
  /** Provider transcript path (Pi JSONL); open handle only. */
  path: string
  title: string
  modifiedAt: number
  messageCount: number
}

/** One project row in the sidebar tree. */
export type ProjectSummary = {
  path: string
  name: string
  collapsed: boolean
  sessions: SessionSummary[]
}

/** Sidebar title from the first line of a user prompt. */
export function titleFromPrompt(text: string): string {
  const line = text.trim().split(/\r?\n/, 1)[0] ?? ""
  if (!line) return "New chat"
  return line.length > 80 ? `${line.slice(0, 79)}…` : line
}

/** Display name for a project path (final path segment). */
export function projectName(cwd: string): string {
  const parts = cwd.replace(/\\/g, "/").split("/").filter(Boolean)
  return parts[parts.length - 1] ?? cwd
}

/**
 * Sidebar workspace: selected project (`cwd`), open chat, and the project tree
 * (each project owns its sessions).
 */
export type WorkspaceState = {
  cwd: string | null
  sessionFile: string | null
  projects: ProjectSummary[]
}

export type WorkspaceResult = { ok: true; workspace: WorkspaceState } | { ok: false; error: string }

/** Everything the renderer receives from the main process: protocol events only. */
export type HostEvent = AgentEvent

/** The renderer's reply to an approval prompt, named apart from `HostEvent`. */
export type { PermissionDecision }
