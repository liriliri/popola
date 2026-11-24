/**
 * Class names for settings layouts. See `popolaClass` for the style contract.
 *
 * These are presentational building blocks — no store state, no slots. A host
 * composes them into a settings page; the agent never drives them.
 */
export const settingsClass = {
  /** Detail column: padded content inside the layout's main pane. */
  settings: "popola-settings",

  /** Desktop split: sidebar + detail. */
  settingsLayout: "popola-settings-layout",
  settingsDetail: "popola-settings-layout__detail",

  settingsSidebar: "popola-settings-sidebar",
  settingsSidebarHeader: "popola-settings-sidebar__header",
  settingsSidebarBody: "popola-settings-sidebar__body",
  settingsSidebarGroup: "popola-settings-sidebar__group",
  settingsSidebarGroupLabel: "popola-settings-sidebar__group-label",
  settingsSidebarItem: "popola-settings-sidebar__item",
  settingsSidebarItemSelected: "popola-settings-sidebar__item--selected",
  settingsSidebarItemLeading: "popola-settings-sidebar__item-leading",
  settingsSidebarItemLabel: "popola-settings-sidebar__item-label",

  settingsGroup: "popola-settings__group",
  settingsGroupHeader: "popola-settings__group-header",
  settingsGroupTitle: "popola-settings__group-title",
  settingsGroupTrailing: "popola-settings__group-trailing",

  settingsSection: "popola-settings__section",
  settingsSectionFlush: "popola-settings__section--flush",
  settingsSectionHeader: "popola-settings__section-header",
  settingsSectionTitle: "popola-settings__section-title",
  settingsSectionTrailing: "popola-settings__section-trailing",
  settingsSectionContent: "popola-settings__section-content",

  settingsCard: "popola-settings__card",
  settingsCardItem: "popola-settings__card-item",
  settingsCardItemBorder: "popola-settings__card-item--border",

  settingsRow: "popola-settings__row",
  settingsRowLeading: "popola-settings__row-leading",
  settingsRowContent: "popola-settings__row-content",
  settingsRowLabel: "popola-settings__row-label",
  settingsRowLabelMuted: "popola-settings__row-label--muted",
  settingsRowLabelRow: "popola-settings__row-label-row",
  settingsRowHint: "popola-settings__row-hint",
  settingsRowError: "popola-settings__row-error",
  settingsRowControl: "popola-settings__row-control",
  settingsRowTrailing: "popola-settings__row-trailing",
  settingsRowSummary: "popola-settings__row-summary",
  settingsRowChevron: "popola-settings__row-chevron",
  settingsRowChevronExpanded: "popola-settings__row-chevron--expanded",
  settingsRowPressable: "popola-settings__row--pressable",
  settingsRowDisabled: "popola-settings__row--disabled",

  settingsSwitch: "popola-settings__switch",
  settingsSwitchChecked: "popola-settings__switch--checked",
  settingsSwitchThumb: "popola-settings__switch-thumb",
  settingsSwitchThumbChecked: "popola-settings__switch-thumb--checked",

  settingsSelect: "popola-settings__select",
  settingsInput: "popola-settings__input",
} as const
