import { selectPermissions } from "popola-ui"
import { usePopola } from "./context.js"
import { usePopolaState } from "./use-popola-state.js"
import { Slot } from "./slot.js"
import { DefaultPermission } from "./defaults.js"
import type { PopolaSlots } from "./context.js"

/**
 * Approval prompts.
 *
 * The agent never renders its own dialogs — it raises a request and the host
 * decides what the user sees. This component is the default rendering; replace
 * the `permission.dialog` slot to put the prompt somewhere else entirely.
 */
export function PopolaPermissions(props: { slots?: PopolaSlots; className?: string }) {
  const { onPermissionReply } = usePopola()
  const requests = usePopolaState(selectPermissions)

  if (requests.length === 0) return null

  return (
    <Slot
      name="permission.dialog"
      slotProps={{
        requests,
        onReply: (id, decision) => onPermissionReply?.(id, decision),
      }}
      local={props.slots}
      fallback={<DefaultPermission requests={requests} onReply={(id, decision) => onPermissionReply?.(id, decision)} />}
    />
  )
}
