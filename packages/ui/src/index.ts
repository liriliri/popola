export type {
  Attachment,
  AttachmentPart,
  ComposerState,
  ErrorPart,
  Message,
  Part,
  PermissionRequest,
  PopolaRole,
  PopolaState,
  ReasoningPart,
  TextPart,
  ToolCall,
  ToolCallDetail,
  ToolPart,
  ToolStatus,
} from "./state"

// Re-exported so a host needs one dependency to render and drive an agent.
export type {
  AgentEvent,
  AgentSession,
  AgentSessionFactory,
  AgentSnapshot,
  AgentUsage,
  PlanEntry,
  PopolaStatus,
} from "popola-protocol"

export { reduce, initialState } from "./reducer"
export type { PopolaEvent, PopolaUiEvent } from "./reducer"

export { createStore } from "./store"
export type { PopolaStore } from "./store"

export {
  selectCanSend,
  selectCanStop,
  selectError,
  selectIsBusy,
  selectMessages,
  selectPermissions,
  selectSnapshot,
} from "./selectors"

export { popolaSlot, resolveSlot } from "./slots"
export type {
  PermissionDecision,
  PopolaSlotName,
  SlotName,
  SlotProps,
  SlotPropsFor,
  ToolSlotName,
} from "./slots"

export { popolaClass } from "./classes"
export type { PopolaClassName } from "./classes"
