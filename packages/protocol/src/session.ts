import type { AgentEvent } from "./events"
import type { PermissionDecision } from "./permission"

/**
 * A live agent session. Platform-free: `cwd`, `spawn` and `process.env` belong
 * to the factory, and cancellation goes through `interrupt` rather than an
 * `AbortSignal` (which differs between DOM and Node type libraries).
 */
export interface AgentSession {
  readonly provider: string
  /** Runs one turn. Resolves when the agent finishes. */
  prompt(text: string): Promise<void>
  /** Stops the run in flight. */
  interrupt(): void
  /** Answers a pending permission request. */
  respondToPermission(id: string, decision: PermissionDecision): void
  subscribe(listener: (event: AgentEvent) => void): () => void
  /** Releases live resources. The durable session, if any, is not deleted. */
  close(): void
}

/** Creates a session; the host owns how (spawn a CLI, call a model API, ...). */
export type AgentSessionFactory<TConfig = unknown> = (
  config: TConfig,
) => AgentSession | Promise<AgentSession>
