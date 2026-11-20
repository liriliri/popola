import type { ReactNode } from "react"
import { resolveSlot, type SlotName, type SlotPropsFor } from "popola-ui"
import { usePopola, type PopolaSlots } from "./context.js"

/**
 * Renders one slot.
 *
 * Looks for an implementation in the local map first (a `slots` prop on the
 * component), then the provider's map, then falls back to the built-in
 * rendering the caller supplied.
 *
 * The `base` argument names the slot family, so a host can register
 * `conversation.message.user` to change only user messages, or
 * `conversation.message` to change every message.
 */
export function Slot<Name extends SlotName>(props: {
  name: Name
  base?: SlotName
  slotProps: SlotPropsFor<Name>
  fallback?: ReactNode
  local?: PopolaSlots
}) {
  const context = usePopola()
  const resolved = resolveSlot(props.local, context.slots, props.name, props.base)

  if (resolved) {
    const Component = resolved as React.ComponentType<Record<string, unknown>>
    return <Component {...props.slotProps} />
  }

  return <>{props.fallback}</>
}
