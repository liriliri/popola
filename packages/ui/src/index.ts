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
  PopolaStatus,
  ReasoningPart,
  TextPart,
  ToolCall,
  ToolPart,
  ToolStatus,
} from "./state"

export { reduce, initialState } from "./reducer"
export type { PopolaEvent } from "./reducer"

export { createStore } from "./store"
export type { PopolaStore } from "./store"

export {
  selectCanSend,
  selectCanStop,
  selectError,
  selectIsBusy,
  selectMessages,
  selectPermissions,
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
