import { composerSlot, type ComposerSlotProps } from "./composer"
import { conversationSlot, type ConversationSlotProps } from "./conversation"
import { messageSlot, type MessageSlotProps } from "./message"
import { permissionSlot, type PermissionDecision, type PermissionSlotProps } from "./permission"
import { shellSlot, type ShellSlotProps } from "./shell"

/**
 * The slot catalogue: named positions a renderer leaves open for the host.
 * Props are fixed by {@link SlotProps}. Names are `domain.position`; the one
 * dynamic family, `conversation.tool.<toolName>`, lets a host style one tool
 * while the rest fall back to the generic tool slot.
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

export type ToolSlotName = `conversation.tool.${string}`

export type SlotName = PopolaSlotName | ToolSlotName

export type { PermissionDecision }

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
 * Picks a slot: scope beats specificity — local exact → local base → global
 * exact → global base. No match means the caller uses its built-in rendering.
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
