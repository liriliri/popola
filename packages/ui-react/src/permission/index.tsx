import { popolaClass, selectPermissions, type PermissionDecision, type PermissionRequest } from "popola-ui"
import className from "licia/className"
import { usePopola } from "../context"
import { usePopolaState } from "../use-popola-state"
import { Slot } from "../slot"
import type { PopolaSlots } from "../context"

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

  const onReply = (id: string, decision: PermissionDecision) => onPermissionReply?.(id, decision)

  return (
    <Slot
      name="permission.dialog"
      slotProps={{ requests, onReply }}
      local={props.slots}
      fallback={<DefaultPermission requests={requests} onReply={onReply} />}
    />
  )
}

export function DefaultPermission(props: {
  requests: PermissionRequest[]
  onReply: (id: string, decision: PermissionDecision) => void
}) {
  return (
    <div className={popolaClass.permissionLayer}>
      {props.requests.map((request) => (
        <div key={request.id} className={popolaClass.permission}>
          <div className={popolaClass.permissionTitle}>{request.title}</div>
          <div className={popolaClass.permissionResources}>{request.resources.join("\n")}</div>
          <div className={popolaClass.permissionActions}>
            <button
              className={className(popolaClass.button, popolaClass.buttonPrimary)}
              onClick={() => props.onReply(request.id, "once")}
            >
              Allow once
            </button>
            <button className={popolaClass.button} onClick={() => props.onReply(request.id, "always")}>
              Always allow
            </button>
            <button
              className={className(popolaClass.button, popolaClass.buttonGhost)}
              onClick={() => props.onReply(request.id, "reject")}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
