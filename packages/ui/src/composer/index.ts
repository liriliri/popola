import type { Attachment } from "../message"
import type { PopolaState } from "../state"

export type ComposerState = {
  readonly text: string
  readonly attachments: Attachment[]
}

export {
  filterComposerModelRows,
  flattenComposerModelGroups,
  groupComposerModelRows,
} from "./modelPicker"
export type {
  ComposerModelFlatRow,
  ComposerModelGroup,
  ComposerModelOption,
} from "./modelPicker"

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
  composerToolbar: "popola-composer__toolbar",
  composerActionsTrailing: "popola-composer__actions-trailing",
  composerButton: "popola-composer__button",
  composerSend: "popola-composer__button--send",
  composerStop: "popola-composer__button--stop",

  /** Model / provider picker inside the composer field. */
  composerModelPicker: "popola-composer-model",
  composerModelChip: "popola-composer-model__chip",
  composerModelChipOpen: "popola-composer-model__chip--open",
  composerModelChipLabel: "popola-composer-model__chip-label",
  composerModelChipProvider: "popola-composer-model__chip-provider",
  composerModelChipChevron: "popola-composer-model__chip-chevron",
  composerModelMenu: "popola-composer-model__menu",
  composerModelMenuOpen: "popola-composer-model__menu--open",
  composerModelSearch: "popola-composer-model__search",
  composerModelSearchIcon: "popola-composer-model__search-icon",
  composerModelSearchInput: "popola-composer-model__search-input",
  composerModelBody: "popola-composer-model__body",
  composerModelGroup: "popola-composer-model__group",
  composerModelGroupTitle: "popola-composer-model__group-title",
  composerModelOption: "popola-composer-model__option",
  composerModelOptionActive: "popola-composer-model__option--active",
  composerModelOptionLabel: "popola-composer-model__option-label",
  composerModelOptionCheck: "popola-composer-model__option-check",
  composerModelEmpty: "popola-composer-model__empty",
} as const

export const composerSlot = {
  composerInput: "composer.input",
  composerSend: "composer.send",
  composerStop: "composer.stop",
  composerContext: "composer.context",
  /** Leading controls in the composer actions row (model picker, …). */
  composerToolbar: "composer.toolbar",
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
  "composer.toolbar": Record<string, never>
}
