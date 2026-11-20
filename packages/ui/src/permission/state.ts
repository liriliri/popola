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
