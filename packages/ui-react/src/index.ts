export { PopolaProvider, usePopola, useResolvedTheme, POPOLA_THEME_OPTIONS } from "./context"
export type {
  PopolaContextValue,
  PopolaSendPayload,
  PopolaSlots,
  PopolaTheme,
  PopolaThemeName,
  PopolaThemeOption,
} from "./context"

export { usePopolaState } from "./usePopolaState"

export { Slot } from "./slot"

export { PopolaShell } from "./shell/index"
export { PopolaConversation } from "./conversation/index"
export { PopolaComposer } from "./composer/index"
export { PopolaPermissions, DefaultPermission } from "./permission/index"

export { PopolaCard, DefaultPart, DefaultToolCall } from "./message/index"

export { PopolaTypingIndicator } from "./message/streaming"

export { PopolaMarkdown } from "./markdown"

export {
  SettingsLayout,
  SettingsSidebar,
  SettingsSidebarGroup,
  SettingsSidebarItem,
  SettingsPage,
  SettingsGroup,
  SettingsSection,
  SettingsCard,
  SettingsRow,
  SettingsSwitch,
  SettingsSelect,
  SettingsInput,
  SettingsAction,
  SettingsDetailRow,
  SettingsAddRow,
  SettingsThemePicker,
} from "./settings/index"
export type { SettingsRowProps, SettingsSelectOption } from "./settings/index"

export {
  Sidebar,
  SidebarNav,
  SidebarFooter,
  SidebarSeparator,
  SidebarSection,
  SidebarHint,
  SidebarError,
  SidebarList,
  SidebarItem,
} from "./sidebar/index"
