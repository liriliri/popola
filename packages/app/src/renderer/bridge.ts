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
  pickDirectory(): Promise<WorkspaceResult>
  setCwd(cwd: string): Promise<WorkspaceResult>
  newSession(): Promise<WorkspaceResult>
  openSession(sessionFile: string): Promise<WorkspaceResult>
  prompt(text: string): Promise<void>
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
