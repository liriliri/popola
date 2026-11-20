import { composerClass } from "./composer/classes"
import { conversationClass } from "./conversation/classes"
import { markdownClass } from "./markdown/classes"
import { messageClass } from "./message/classes"
import { permissionClass } from "./permission/classes"
import { shellClass } from "./shell/classes"

/**
 * Class names are part of the public contract.
 *
 * The stylesheet in `popola-ui/styles.css` targets these names and nothing else,
 * so a renderer in any framework produces the same look by using the same
 * strings. Two rules keep that true:
 *
 * 1. Styles depend on class names only — never on DOM shape. No descendant or
 *    child selectors that assume a particular nesting. A renderer is free to
 *    wrap things differently.
 * 2. Names are stable. Renaming one is a breaking change for every host that
 *    styled around it.
 */
export const popolaClass = {
  ...shellClass,
  ...conversationClass,
  ...messageClass,
  ...composerClass,
  ...permissionClass,
  ...markdownClass,
} as typeof shellClass &
  typeof conversationClass &
  typeof messageClass &
  typeof composerClass &
  typeof permissionClass &
  typeof markdownClass

export type PopolaClassName = (typeof popolaClass)[keyof typeof popolaClass]
