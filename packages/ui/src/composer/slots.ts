import type { Attachment } from "../message/state"

export const composerSlot = {
  composerInput: "composer.input",
  composerSend: "composer.send",
  composerStop: "composer.stop",
  composerContext: "composer.context",
} as const

export type ComposerSlotProps = {
  "composer.input": {
    value: string
    onChange: (text: string) => void
    onSubmit: () => void
  }
  "composer.send": { canSend: boolean; onClick: () => void }
  "composer.stop": { onClick: () => void }
  "composer.context": {
    attachments: Attachment[]
    onRemove: (id: string) => void
  }
}
