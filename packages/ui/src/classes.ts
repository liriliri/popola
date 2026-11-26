import { composerClass } from "./composer"
import { conversationClass } from "./conversation"
import { markdownClass } from "./markdown"
import { menuClass } from "./menu"
import { messageClass } from "./message"
import { permissionClass } from "./permission"
import { settingsClass } from "./settings"
import { shellClass } from "./shell"
import { sidebarClass } from "./sidebar"
import { toastClass } from "./toast"

/**
 * Public style contract: the stylesheet targets these strings only, never DOM
 * shape. Renaming one is a breaking change for hosts.
 */
export const popolaClass = {
  ...shellClass,
  ...conversationClass,
  ...messageClass,
  ...composerClass,
  ...permissionClass,
  ...markdownClass,
  ...menuClass,
  ...settingsClass,
  ...sidebarClass,
  ...toastClass,
} as typeof shellClass &
  typeof conversationClass &
  typeof messageClass &
  typeof composerClass &
  typeof permissionClass &
  typeof markdownClass &
  typeof menuClass &
  typeof settingsClass &
  typeof sidebarClass &
  typeof toastClass

export type PopolaClassName = (typeof popolaClass)[keyof typeof popolaClass]
