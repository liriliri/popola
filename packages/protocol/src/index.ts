/**
 * popola-protocol: the transport-neutral contract between an agent runtime and
 * the UI. Isomorphic — no DOM or Node APIs, so either host can depend on it.
 */

export type {
  AgentEvent,
  AgentSnapshot,
  AgentUsage,
  PlanEntry,
  PopolaStatus,
} from "./events"

export type {
  Attachment,
  AttachmentPart,
  ErrorPart,
  Message,
  Part,
  PopolaRole,
  ReasoningPart,
  TextPart,
  ToolCall,
  ToolCallDetail,
  ToolPart,
  ToolStatus,
} from "./message"

export type { PermissionDecision, PermissionRequest } from "./permission"

export type { AgentSession, AgentSessionFactory } from "./session"

export { isAgentEvent } from "./guard"
