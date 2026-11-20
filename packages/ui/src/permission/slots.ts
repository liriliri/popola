import type { PermissionRequest } from "./state"

/** How a host answers a permission request. */
export type PermissionDecision = "once" | "always" | "reject"

export const permissionSlot = {
  permissionDialog: "permission.dialog",
} as const

export type PermissionSlotProps = {
  "permission.dialog": {
    requests: PermissionRequest[]
    onReply: (id: string, decision: PermissionDecision) => void
  }
}
