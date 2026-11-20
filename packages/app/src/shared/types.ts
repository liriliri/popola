import type { Message } from "popola-ui"

/** What the temporary form collects. There is no Tinker provider list to read. */
export type ProviderConfig = {
  provider: string
  baseUrl: string
  apiKey: string
  model: string
}

export type ProviderResult = { ok: true } | { ok: false; error: string }

export type HostEvent =
  | { type: "messages"; messages: Message[] }
  | { type: "running"; running: boolean }
