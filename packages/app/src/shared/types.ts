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

/** One Pi session under the current working directory. */
export type SessionSummary = {
  id: string
  path: string
  title: string
  modifiedAt: number
  messageCount: number
}

/** Sidebar workspace: a cwd, its Pi chats, and a few recent directories. */
export type WorkspaceState = {
  cwd: string | null
  sessionFile: string | null
  recent: string[]
  sessions: SessionSummary[]
}

export type WorkspaceResult = { ok: true; workspace: WorkspaceState } | { ok: false; error: string }

/** Everything the renderer receives from the main process: protocol events only. */
export type HostEvent = AgentEvent

/** The renderer's reply to an approval prompt, named apart from `HostEvent`. */
export type { PermissionDecision }
