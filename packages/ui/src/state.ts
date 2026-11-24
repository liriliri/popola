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
  readonly usage?: AgentUsage
  readonly plan?: PlanEntry[]
  readonly model?: string
  readonly modeID?: string | null
}
