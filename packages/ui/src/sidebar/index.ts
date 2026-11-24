/**
 * Class names for the host sidebar (directory / chat list). See `popolaClass`.
 *
 * Layout mirrors paseo's left rail: quiet nav rows, a hairline separator, then
 * muted section labels over compact list rows. Presentational only.
 */
export const sidebarClass = {
  sidebar: "popola-sidebar",

  sidebarNav: "popola-sidebar__nav",
  sidebarFooter: "popola-sidebar__footer",
  sidebarSeparator: "popola-sidebar__separator",

  sidebarSection: "popola-sidebar__section",
  sidebarSectionGrow: "popola-sidebar__section--grow",
  sidebarSectionHeader: "popola-sidebar__section-header",
  sidebarSectionTitle: "popola-sidebar__section-title",
  sidebarSectionTrailing: "popola-sidebar__section-trailing",

  sidebarHint: "popola-sidebar__hint",
  sidebarError: "popola-sidebar__error",

  sidebarList: "popola-sidebar__list",

  sidebarItem: "popola-sidebar__item",
  sidebarItemSelected: "popola-sidebar__item--selected",
  sidebarItemLeading: "popola-sidebar__item-leading",
  sidebarItemBody: "popola-sidebar__item-body",
  sidebarItemTitle: "popola-sidebar__item-title",
  sidebarItemTitleMuted: "popola-sidebar__item-title--muted",
  sidebarItemMeta: "popola-sidebar__item-meta",
} as const
