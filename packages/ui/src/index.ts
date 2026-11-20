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
} from "./state.js"

export { reduce, initialState } from "./reducer.js"
export type { PopolaEvent } from "./reducer.js"

export { createStore } from "./store.js"
export type { PopolaStore } from "./store.js"

export {
  selectCanSend,
  selectCanStop,
  selectError,
  selectIsBusy,
  selectMessages,
  selectPermissions,
} from "./selectors.js"

export { popolaSlot, resolveSlot } from "./slots.js"
export type {
  PermissionDecision,
  PopolaSlotName,
  SlotName,
  SlotProps,
  SlotPropsFor,
  ToolSlotName,
} from "./slots.js"

export { popolaClass } from "./classes.js"
export type { PopolaClassName } from "./classes.js"
