import type { Message, Part } from "./message"
import type { PermissionRequest } from "./permission"

export type PopolaStatus = "idle" | "busy" | "error"

export type AgentUsage = {
  readonly inputTokens: number
  readonly outputTokens: number
  readonly cacheReadTokens?: number
  readonly cacheWriteTokens?: number
  readonly totalTokens?: number
  readonly costUsd?: number
}

export type PlanEntry = {
  readonly id: string
  readonly content: string
  readonly status: "pending" | "in_progress" | "completed"
}

/** Full agent state for a client that joins late. */
export type AgentSnapshot = {
  readonly status: PopolaStatus
  readonly messages: Message[]
  readonly permissions: PermissionRequest[]
  readonly error?: string
  readonly usage?: AgentUsage
  readonly plan?: PlanEntry[]
  readonly model?: string
  readonly modeID?: string | null
}

/**
 * The event set a transport produces and the state core consumes. Each adapter
 * maps its own protocol onto these variants, so the UI never learns which agent
 * is running. `message.part` upserts by part id, so a streaming text part
 * replaces its own earlier version.
 *
 * `plan`, `model.changed` and `mode.changed` are reserved for ACP; no adapter
 * produces them yet.
 */
export type AgentEvent =
  | { type: "session.snapshot"; snapshot: AgentSnapshot }
  | { type: "session.started"; sessionID: string; provider: string }
  | { type: "turn.started"; turnID: string }
  | { type: "turn.completed"; turnID: string }
  | { type: "turn.failed"; turnID: string; error: string }
  | { type: "turn.canceled"; turnID: string }
  | { type: "message.started"; message: Message }
  | { type: "message.part"; messageID: string; part: Part }
  | { type: "message.removed"; messageID: string }
  | { type: "permission.requested"; request: PermissionRequest }
  | { type: "permission.resolved"; id: string }
  | { type: "usage"; usage: AgentUsage }
  | { type: "plan"; entries: PlanEntry[] }
  | { type: "model.changed"; model: string }
  | { type: "mode.changed"; modeID: string | null }
