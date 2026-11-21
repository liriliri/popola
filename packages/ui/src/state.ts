/** Plain data shapes shared by the transport, state core and every renderer. */

import type { ComposerState } from "./composer"
import type { Message } from "./message"
import type { PermissionRequest } from "./permission"
import type { AgentUsage, PlanEntry, PopolaStatus } from "popola-protocol"

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

export type { ComposerState } from "./composer"
export type { PermissionRequest } from "./permission"

export type PopolaState = {
  readonly status: PopolaStatus
  readonly messages: Message[]
  readonly permissions: PermissionRequest[]
  readonly composer: ComposerState
  readonly error?: string
  /** Latest counters reported by the agent. */
  readonly usage?: AgentUsage
  /** Latest task plan reported by the agent. */
  readonly plan?: PlanEntry[]
  /** Model the agent is running, when it reports one. */
  readonly model?: string
  /** Session mode the agent is in, when it reports one. */
  readonly modeID?: string | null
}
