/**
 * Domain shapes for a conversation with a coding agent.
 *
 * Everything here is plain data. No framework, no runtime, no DOM. The same
 * shapes travel from the agent transport into the state core and out to the
 * renderers, which is what lets one core serve React, Vue and anything else.
 */

export type PopolaRole = "user" | "assistant" | "system"

export type ToolStatus = "pending" | "running" | "completed" | "error"

export type ToolCall = {
  readonly id: string
  readonly name: string
  readonly status: ToolStatus
  /** Human-readable label the host may override. */
  readonly title?: string
  readonly input?: Record<string, unknown>
  readonly output?: string
  readonly error?: string
  readonly startedAt?: number
  readonly endedAt?: number
}

export type Attachment = {
  readonly id: string
  readonly name: string
  readonly mimeType?: string
  readonly size?: number
  readonly url?: string
}

export type TextPart = {
  readonly id: string
  readonly type: "text"
  readonly text: string
}

export type ReasoningPart = {
  readonly id: string
  readonly type: "reasoning"
  readonly text: string
}

export type ToolPart = {
  readonly id: string
  readonly type: "tool"
  readonly call: ToolCall
}

export type AttachmentPart = {
  readonly id: string
  readonly type: "attachment"
  readonly attachment: Attachment
}

export type ErrorPart = {
  readonly id: string
  readonly type: "error"
  readonly message: string
}

export type Part = TextPart | ReasoningPart | ToolPart | AttachmentPart | ErrorPart

export type Message = {
  readonly id: string
  readonly role: PopolaRole
  readonly parts: Part[]
  readonly createdAt?: number
}

export type PermissionRequest = {
  readonly id: string
  /** What the agent wants to do, e.g. "bash". */
  readonly action: string
  /** What it wants to touch, e.g. ["rm -rf build"]. */
  readonly resources: string[]
  readonly title: string
  readonly detail?: string
  readonly toolName?: string
}

export type PopolaStatus = "idle" | "busy" | "error"

export type ComposerState = {
  readonly text: string
  readonly attachments: Attachment[]
}

export type PopolaState = {
  readonly status: PopolaStatus
  readonly messages: Message[]
  readonly permissions: PermissionRequest[]
  readonly composer: ComposerState
  readonly error?: string
}
