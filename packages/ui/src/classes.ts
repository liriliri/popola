import { composerClass } from "./composer"
import { conversationClass } from "./conversation"
import { markdownClass } from "./markdown"
import { messageClass } from "./message"
import { permissionClass } from "./permission"
import { settingsClass } from "./settings"
import { shellClass } from "./shell"
import { sidebarClass } from "./sidebar"

/**
 * Class names are the public style contract: the stylesheet targets these
 * strings only, never DOM shape, so any renderer can nest freely. Renaming one
 * is a breaking change for hosts that styled around it.
 */
export const popolaClass = {
  ...shellClass,
  ...conversationClass,
  ...messageClass,
  ...composerClass,
  ...permissionClass,
  ...markdownClass,
  ...settingsClass,
  ...sidebarClass,
} as typeof shellClass &
  typeof conversationClass &
  typeof messageClass &
  typeof composerClass &
  typeof permissionClass &
  typeof markdownClass &
  typeof settingsClass &
  typeof sidebarClass

export type PopolaClassName = (typeof popolaClass)[keyof typeof popolaClass]
