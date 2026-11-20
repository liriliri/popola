import type { ReactNode } from "react"
import { resolveSlot, type SlotName, type SlotPropsFor } from "popola-ui"
import { usePopola, type PopolaSlots } from "./context"

/**
 * Renders one slot using `resolveSlot` (local → global → built-in fallback).
 * `base` names the slot family for a broader override.
 */
export function Slot<Name extends SlotName>(props: {
  name: Name
  base?: SlotName
  slotProps: SlotPropsFor<Name>
  fallback?: ReactNode
  local?: PopolaSlots
  /** Wraps a resolved slot. The fallback stays unwrapped, so an empty slot adds no box. */
  className?: string
}) {
  const context = usePopola()
  const resolved = resolveSlot(props.local, context.slots, props.name, props.base)

  if (resolved) {
    const Component = resolved as React.ComponentType<Record<string, unknown>>
    const node = <Component {...props.slotProps} />
    if (!props.className) return node
    return <div className={props.className}>{node}</div>
  }

  return <>{props.fallback}</>
}
