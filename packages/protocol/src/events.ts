/** The transport-neutral event set every agent adapter emits. */

import type { Message, Part } from "./message"
import type { PermissionRequest } from "./permission"

/** Whether an agent run is in flight. */
export type PopolaStatus = "idle" | "busy" | "error"

/** Token and cost counters reported by an agent. */
export type AgentUsage = {
  readonly inputTokens: number
  readonly outputTokens: number
  readonly cacheReadTokens?: number
  readonly cacheWriteTokens?: number
  readonly totalTokens?: number
  readonly costUsd?: number
}

/** One entry of a task plan. */
export type PlanEntry = {
  readonly id: string
  readonly content: string
  readonly status: "pending" | "in_progress" | "completed"
}

/** The full agent state at one point in time, for a client that joins late. */
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
 * The event set a transport produces and the state core consumes.
 *
 * Every agent adapter maps its own protocol onto these variants, so the UI
 * never learns which agent is running. `message.part` upserts by part id, so a
 * streaming text part replaces its own earlier version.
 */
export type AgentEvent =
  /** The complete state, sent to a client that joins after the run started. */
  | { type: "session.snapshot"; snapshot: AgentSnapshot }
  | { type: "session.started"; sessionID: string; provider: string }
  /** A run is in flight. */
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
  /**
   * The task plan the agent is following.
   *
   * Reserved for ACP, which reports plans. No adapter produces it yet.
   */
  | { type: "plan"; entries: PlanEntry[] }
  /**
   * The model the agent switched to.
   *
   * Reserved for ACP, which reports model changes. No adapter produces it yet.
   */
  | { type: "model.changed"; model: string }
  /**
   * The session mode the agent switched to.
   *
   * Reserved for ACP, which reports mode changes. No adapter produces it yet.
   */
  | { type: "mode.changed"; modeID: string | null }
