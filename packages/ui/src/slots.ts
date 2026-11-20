import { composerSlot, type ComposerSlotProps } from "./composer"
import { conversationSlot, type ConversationSlotProps } from "./conversation"
import { messageSlot, type MessageSlotProps } from "./message"
import { permissionSlot, type PermissionDecision, type PermissionSlotProps } from "./permission"
import { shellSlot, type ShellSlotProps } from "./shell"

/**
 * The slot catalogue.
 *
 * A slot is a named position a renderer leaves open for the host to fill.
 * Every slot the default components render has an entry here, and its props
 * are fixed by {@link SlotProps}.
 *
 * Names are namespaced `domain.position`. The one dynamic family is
 * `conversation.tool.<toolName>`, so a host can give one tool its own card
 * while everything else falls back to the generic tool slot.
 */
export const popolaSlot = {
  ...shellSlot,
  ...conversationSlot,
  ...messageSlot,
  ...composerSlot,
  ...permissionSlot,
} as typeof shellSlot &
  typeof conversationSlot &
  typeof messageSlot &
  typeof composerSlot &
  typeof permissionSlot

export type PopolaSlotName = (typeof popolaSlot)[keyof typeof popolaSlot]

/** Dynamic slot names are typed separately so hosts can key them safely. */
export type ToolSlotName = `conversation.tool.${string}`

export type SlotName = PopolaSlotName | ToolSlotName

export type { PermissionDecision }

/** Plain data plus callbacks — no framework types. */
export type SlotProps = ShellSlotProps &
  ConversationSlotProps &
  MessageSlotProps &
  ComposerSlotProps &
  PermissionSlotProps

export type SlotPropsFor<Name extends SlotName> = Name extends `conversation.tool.${string}`
  ? SlotProps["conversation.tool"]
  : Name extends keyof SlotProps
    ? SlotProps[Name]
    : Record<string, never>

/**
 * Picks a slot implementation. Scope beats specificity: local (component)
 * slots win over global (provider) ones; within each, the exact name wins over
 * the family base. Order: local exact → local base → global exact → global
 * base. No match means the caller uses its built-in rendering.
 */
export function resolveSlot<T>(
  local: Partial<Record<SlotName, T>> | undefined,
  global: Partial<Record<SlotName, T>> | undefined,
  name: SlotName,
  base?: SlotName,
): T | undefined {
  const localExact = local?.[name]
  if (localExact !== undefined) return localExact

  if (base !== undefined) {
    const localBase = local?.[base]
    if (localBase !== undefined) return localBase
  }

  const globalExact = global?.[name]
  if (globalExact !== undefined) return globalExact

  if (base === undefined) return undefined
  return global?.[base]
}
