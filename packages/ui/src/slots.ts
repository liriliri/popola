import { composerSlot, type ComposerSlotProps } from "./composer/slots"
import { conversationSlot, type ConversationSlotProps } from "./conversation/slots"
import { messageSlot, type MessageSlotProps } from "./message/slots"
import { permissionSlot, type PermissionSlotProps } from "./permission/slots"
import { shellSlot, type ShellSlotProps } from "./shell/slots"

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

export type { PermissionDecision } from "./permission/slots"

/**
 * The props each slot receives.
 *
 * These are plain data plus callbacks — no framework types — so the same
 * contract holds for React, Vue or anything else.
 */
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
 * Picks the implementation for a slot.
 *
 * Precedence, most specific first:
 *
 * 1. the exact name in the local map (a prop on the component)
 * 2. the family base in the local map
 * 3. the exact name in the global map (the provider)
 * 4. the family base in the global map
 *
 * Scope wins before specificity: a slot handed to one component beats a slot
 * the provider registers for everything, because the narrower scope is the
 * more deliberate override. Within a scope, the exact name beats the family
 * base.
 *
 * When nothing matches the caller falls back to the built-in rendering.
 *
 * The value type is generic so this stays free of any framework's component
 * type; a renderer passes its own.
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
