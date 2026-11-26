export {
  PopolaProvider,
  usePopola,
  usePortalTheme,
  useResolvedTheme,
  POPOLA_THEME_OPTIONS,
  DEFAULT_POPOLA_LABELS,
} from "./context"
export type {
  PopolaContextValue,
  PopolaLabels,
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
export { PopolaComposer, ComposerModelPicker, ComposerToolbar } from "./composer/index"
export type { ComposerModelSelection } from "./composer/index"
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
  SettingsCredentialsField,
  SettingsServiceChip,
  SettingsAddRow,
  SettingsThemePicker,
  SettingsProviderChooser,
  SettingsModelPanes,
  SettingsToggle,
  PopolaDialog,
  SettingsServicePanel,
  /** @deprecated Use `PopolaContextMenu`. */
  SettingsContextMenu,
} from "./settings/index"
export type {
  SettingsRowProps,
  SettingsSelectOption,
  SettingsServiceRowData,
  /** @deprecated Use `PopolaContextMenuItem`. */
  SettingsContextMenuItem,
} from "./settings/index"

export { PopolaContextMenu } from "./menu/index"
export type { PopolaContextMenuItem } from "./menu/index"

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

export { ToastProvider, useToast } from "./toast/index"
export type { ShowToastOptions, ToastApi } from "./toast/index"
