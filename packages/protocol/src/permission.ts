/** Permission requests: what an agent wants to do, and how a host answers. */

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

/** How a host answers a permission request. */
export type PermissionDecision = "once" | "always" | "reject"
