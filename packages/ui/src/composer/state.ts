import type { Attachment } from "../message/state"

export type ComposerState = {
  readonly text: string
  readonly attachments: Attachment[]
}
