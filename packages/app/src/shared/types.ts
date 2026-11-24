import type { AgentEvent, PermissionDecision } from "popola-protocol"

/** What the temporary form collects. There is no Tinker provider list to read. */
export type ProviderConfig = {
  provider: string
  baseUrl: string
  apiKey: string
  model: string
}

export type ProviderResult = { ok: true } | { ok: false; error: string }

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

/**
 * Everything the renderer receives from the main process.
 *
 * The wire carries protocol events only, so the renderer never learns which
 * agent produced them.
 */
export type HostEvent = AgentEvent

/**
 * The answer the renderer sends back for an approval prompt. It travels in the
 * other direction, so it is named apart from `HostEvent`.
 */
export type { PermissionDecision }
