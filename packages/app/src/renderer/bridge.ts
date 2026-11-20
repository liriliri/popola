import type { HostEvent, ProviderConfig, ProviderResult } from "../shared/types"

export type PopolaBridge = {
  getProvider(): Promise<ProviderConfig | null>
  setProvider(config: ProviderConfig): Promise<ProviderResult>
  prompt(text: string): Promise<void>
  abort(): Promise<void>
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
