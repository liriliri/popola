import { popolaClass, selectPermissions, type PermissionDecision, type PermissionRequest } from "popola-ui"
import className from "licia/className"
import { Check, X } from "lucide-react"
import { usePopola } from "../context"
import { usePopolaState } from "../usePopolaState"
import { Slot } from "../slot"
import type { PopolaSlots } from "../context"

/**
 * Default approval prompt. Agents only raise requests; replace the
 * `permission.dialog` slot to put the prompt elsewhere.
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

type PermissionAction = {
  decision: PermissionDecision
  label: string
  primary?: boolean
}

export function DefaultPermission(props: {
  requests: PermissionRequest[]
  onReply: (id: string, decision: PermissionDecision) => void
}) {
  const { labels } = usePopola()
  const actions: PermissionAction[] = [
    { decision: "reject", label: labels.permissionReject },
    { decision: "once", label: labels.permissionAllowOnce, primary: true },
    { decision: "always", label: labels.permissionAlwaysAllow },
  ]

  return (
    <div className={popolaClass.permissionLayer}>
      {props.requests.map((request) => (
        <div key={request.id} className={popolaClass.permission}>
          <div className={popolaClass.permissionTitle}>{request.title}</div>
          {request.detail ? (
            <div className={popolaClass.permissionDetail}>{request.detail}</div>
          ) : null}
          {request.resources.length > 0 ? (
            <pre className={popolaClass.permissionResources}>{request.resources.join("\n")}</pre>
          ) : null}
          <div className={popolaClass.permissionQuestion}>{labels.permissionQuestion}</div>
          <div className={popolaClass.permissionActions}>
            {actions.map((action) => {
              const Icon = action.decision === "reject" ? X : Check
              return (
                <button
                  key={action.decision}
                  type="button"
                  className={className(popolaClass.permissionOption, {
                    [popolaClass.permissionOptionPrimary]: action.primary,
                  })}
                  onClick={() => props.onReply(request.id, action.decision)}
                >
                  <Icon size={14} strokeWidth={2} aria-hidden />
                  <span className={popolaClass.permissionOptionLabel}>{action.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
