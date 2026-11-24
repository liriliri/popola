import type { Attachment } from "../message"
import type { PopolaState } from "../state"

export type ComposerState = {
  readonly text: string
  readonly attachments: Attachment[]
}

/** Sending stays available while the agent runs — that is how steering works. */
export function selectCanSend(state: PopolaState): boolean {
  return state.composer.text.trim().length > 0 || state.composer.attachments.length > 0
}

export const composerClass = {
  composer: "popola-composer",
  composerContext: "popola-composer__context",
  composerField: "popola-composer__field",
  composerInput: "popola-composer__input",
  composerActions: "popola-composer__actions",
  composerButton: "popola-composer__button",
  composerSend: "popola-composer__button--send",
  composerStop: "popola-composer__button--stop",
} as const

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
