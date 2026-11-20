import type { PermissionRequest, PopolaState } from "../state"

export function selectPermissions(state: PopolaState): PermissionRequest[] {
  return state.permissions
}
