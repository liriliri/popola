import type { AgentEvent, PermissionDecision } from "popola-protocol"

/** Provider fields the setup form collects. */
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

/** Everything the renderer receives from the main process: protocol events only. */
export type HostEvent = AgentEvent

/** The renderer's reply to an approval prompt, named apart from `HostEvent`. */
export type { PermissionDecision }
