import type {
  HostEvent,
  ListModelsInput,
  ListModelsResult,
  PermissionDecision,
  ProviderConfig,
  ProviderResult,
  WorkspaceResult,
  WorkspaceState,
} from "../shared/types"

export type PopolaBridge = {
  getProvider(): Promise<ProviderConfig | null>
  setProvider(config: ProviderConfig): Promise<ProviderResult>
  listModels(input: ListModelsInput): Promise<ListModelsResult>
  getWorkspace(): Promise<WorkspaceState>
  addProject(): Promise<WorkspaceResult>
  selectProject(cwd: string): Promise<WorkspaceResult>
  setProjectCollapsed(cwd: string, collapsed: boolean): Promise<WorkspaceResult>
  newSession(): Promise<WorkspaceResult>
  openSession(sessionFile: string): Promise<WorkspaceResult>
  archiveSession(sessionFile: string): Promise<WorkspaceResult>
  removeProject(cwd: string): Promise<WorkspaceResult>
  /** Returns an updated workspace when the catalog changed; otherwise null. */
  prompt(text: string): Promise<WorkspaceState | null>
  abort(): Promise<void>
  respondToPermission(id: string, decision: PermissionDecision): Promise<void>
  onEvent(listener: (event: HostEvent) => void): () => void
}

declare global {
  interface Window {
    popola?: PopolaBridge
  }
}

export function bridge(): PopolaBridge {
  const api = window.popola
  if (!api) throw new Error("Open this window from the Electron app.")
  return api
}
