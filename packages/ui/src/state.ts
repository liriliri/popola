/**
 * Domain shapes for a conversation with a coding agent.
 *
 * Everything here is plain data. No framework, no runtime, no DOM. The same
 * shapes travel from the agent transport into the state core and out to the
 * renderers, which is what lets one core serve React, Vue and anything else.
 */

import type { ComposerState } from "./composer/state"
import type { Message } from "./message/state"
import type { PermissionRequest } from "./permission/state"

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
  ToolPart,
  ToolStatus,
} from "./message/state"

export type { ComposerState } from "./composer/state"
export type { PermissionRequest } from "./permission/state"

export type PopolaStatus = "idle" | "busy" | "error"

export type PopolaState = {
  readonly status: PopolaStatus
  readonly messages: Message[]
  readonly permissions: PermissionRequest[]
  readonly composer: ComposerState
  readonly error?: string
}
