/** Plain data shapes shared by the transport, state core and every renderer. */

import type { ComposerState } from "./composer"
import type { Message } from "./message"
import type { PermissionRequest } from "./permission"

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
} from "./message"

export type { ComposerState } from "./composer"
export type { PermissionRequest } from "./permission"

export type PopolaStatus = "idle" | "busy" | "error"

export type PopolaState = {
  readonly status: PopolaStatus
  readonly messages: Message[]
  readonly permissions: PermissionRequest[]
  readonly composer: ComposerState
  readonly error?: string
}
