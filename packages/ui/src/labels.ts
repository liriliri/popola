/** User-facing chrome copy. Hosts pass a partial map to localize. */
export type PopolaLabels = {
  readonly composerPlaceholder: string
  readonly composerSend: string
  readonly composerStop: string
  readonly conversationEmpty: string
  readonly permissionAllowOnce: string
  readonly permissionAlwaysAllow: string
  readonly permissionReject: string
  readonly toolCallRequest: string
  readonly toolCallResult: string
  readonly settingsNav: string
  readonly themePicker: string
}

export const DEFAULT_POPOLA_LABELS: PopolaLabels = {
  composerPlaceholder: "Ask anything",
  composerSend: "Send",
  composerStop: "Stop",
  conversationEmpty: "No messages yet.",
  permissionAllowOnce: "Allow once",
  permissionAlwaysAllow: "Always allow",
  permissionReject: "Reject",
  toolCallRequest: "Request",
  toolCallResult: "Result",
  settingsNav: "Settings",
  themePicker: "Theme",
}

export function resolvePopolaLabels(partial?: Partial<PopolaLabels>): PopolaLabels {
  if (!partial) return DEFAULT_POPOLA_LABELS
  return { ...DEFAULT_POPOLA_LABELS, ...partial }
}
