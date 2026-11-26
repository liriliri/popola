import type { PopolaState } from "../state"
import type { PermissionDecision, PermissionRequest } from "popola-protocol"

export type { PermissionDecision, PermissionRequest } from "popola-protocol"

export function selectPermissions(state: PopolaState): PermissionRequest[] {
  return state.permissions
}

export const permissionClass = {
  permission: "popola-permission",
  permissionLayer: "popola-permission-layer",
  permissionTitle: "popola-permission__title",
  permissionDetail: "popola-permission__detail",
  permissionResources: "popola-permission__resources",
  permissionQuestion: "popola-permission__question",
  permissionActions: "popola-permission__actions",
  permissionOption: "popola-permission__option",
  permissionOptionPrimary: "popola-permission__option--primary",
  permissionOptionLabel: "popola-permission__option-label",

  button: "popola-button",
  buttonPrimary: "popola-button--primary",
  buttonGhost: "popola-button--ghost",
} as const

/** How a host answers a permission request. */
export const permissionSlot = {
  permissionDialog: "permission.dialog",
} as const

export type PermissionSlotProps = {
  "permission.dialog": {
    requests: PermissionRequest[]
    onReply: (id: string, decision: PermissionDecision) => void
  }
}
