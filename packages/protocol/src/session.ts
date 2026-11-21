/** The contract an agent adapter fulfils. */

import type { AgentEvent } from "./events"
import type { PermissionDecision } from "./permission"

/**
 * A live agent session.
 *
 * Deliberately free of any platform API. `cwd`, `spawn` and `process.env`
 * belong to the factory, so the same contract can be implemented by a Node
 * host that spawns a CLI and by a browser host that talks to a model API.
 *
 * Cancellation goes through {@link AgentSession.interrupt} rather than an
 * `AbortSignal`, so the contract stays free of ambient globals that differ
 * between the DOM and Node type libraries.
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

/**
 * Creates a session. Host-specific: a Node host spawns a child process, a
 * browser host calls a model API. The host owns the choice.
 */
export type AgentSessionFactory<TConfig = unknown> = (
  config: TConfig,
) => AgentSession | Promise<AgentSession>
