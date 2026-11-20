import type { PopolaState } from "../state"

export type PermissionRequest = {
  readonly id: string
  /** What the agent wants to do, e.g. "bash". */
  readonly action: string
  /** What it wants to touch, e.g. ["rm -rf build"]. */
  readonly resources: string[]
  readonly title: string
  readonly detail?: string
  readonly toolName?: string
}

export function selectPermissions(state: PopolaState): PermissionRequest[] {
  return state.permissions
}

export const permissionClass = {
  permission: "popola-permission",
  permissionLayer: "popola-permission-layer",
  permissionTitle: "popola-permission__title",
  permissionResources: "popola-permission__resources",
  permissionActions: "popola-permission__actions",

  button: "popola-button",
  buttonPrimary: "popola-button--primary",
  buttonGhost: "popola-button--ghost",
} as const

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
