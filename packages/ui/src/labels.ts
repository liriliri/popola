/** User-facing chrome copy. Hosts pass a partial map to localize. */
export type PopolaLabels = {
  readonly composerPlaceholder: string
  readonly composerSend: string
  readonly composerStop: string
  readonly conversationEmpty: string
  readonly permissionAllowOnce: string
  readonly permissionAlwaysAllow: string
  readonly permissionReject: string
  readonly permissionQuestion: string
  readonly toolCallRequest: string
  readonly toolCallResult: string
  readonly settingsNav: string
  readonly themePicker: string
  readonly composerModel: string
  readonly composerSearchModels: string
  readonly composerNoModels: string
}

export const DEFAULT_POPOLA_LABELS: PopolaLabels = {
  composerPlaceholder: "Ask anything",
  composerSend: "Send",
  composerStop: "Stop",
  conversationEmpty: "What can I help you build?",
  permissionAllowOnce: "Allow once",
  permissionAlwaysAllow: "Always allow",
  permissionReject: "Reject",
  permissionQuestion: "How would you like to proceed?",
  toolCallRequest: "Request",
  toolCallResult: "Result",
  settingsNav: "Settings",
  themePicker: "Theme",
  composerModel: "Model",
  composerSearchModels: "Search models",
  composerNoModels: "No models match that search.",
}

export function resolvePopolaLabels(partial?: Partial<PopolaLabels>): PopolaLabels {
  if (!partial) return DEFAULT_POPOLA_LABELS
  return { ...DEFAULT_POPOLA_LABELS, ...partial }
}
