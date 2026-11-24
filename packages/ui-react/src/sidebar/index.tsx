import type { ReactNode } from "react"
import { popolaClass } from "popola-ui"
import className from "licia/className"

/**
 * Host sidebar building blocks for `shell.sidebar`. Purely presentational.
 * Typical layout: SidebarNav → Separator → SidebarSection("Chats") → SidebarList.
 */

export function Sidebar(props: {
  children?: ReactNode
  className?: string
  "aria-label"?: string
}) {
  return (
    <nav
      className={className(popolaClass.sidebar, props.className)}
      aria-label={props["aria-label"] ?? "Sidebar"}
    >
      {props.children}
    </nav>
  )
}

export function SidebarNav(props: { children?: ReactNode; className?: string }) {
  return <div className={className(popolaClass.sidebarNav, props.className)}>{props.children}</div>
}

export function SidebarFooter(props: { children?: ReactNode; className?: string }) {
  return (
    <div className={className(popolaClass.sidebarFooter, props.className)}>{props.children}</div>
  )
}

export function SidebarSeparator(props: { className?: string }) {
  return (
    <div
      role="separator"
      className={className(popolaClass.sidebarSeparator, props.className)}
    />
  )
}

export function SidebarSection(props: {
  title?: string
  trailing?: ReactNode
  /** Stretch to fill remaining sidebar height (for scrollable lists). */
  grow?: boolean
  children?: ReactNode
  className?: string
}) {
  const titled = props.title !== undefined || props.trailing !== undefined
  return (
    <section
      className={className(
        popolaClass.sidebarSection,
        props.grow ? popolaClass.sidebarSectionGrow : undefined,
        props.className,
      )}
    >
      {titled ? (
        <div className={popolaClass.sidebarSectionHeader}>
          {props.title ? (
            <div className={popolaClass.sidebarSectionTitle}>{props.title}</div>
          ) : (
            <span />
          )}
          {props.trailing ? (
            <div className={popolaClass.sidebarSectionTrailing}>{props.trailing}</div>
          ) : null}
        </div>
      ) : null}
      {props.children}
    </section>
  )
}

export function SidebarHint(props: { children?: ReactNode; className?: string }) {
  return <p className={className(popolaClass.sidebarHint, props.className)}>{props.children}</p>
}

export function SidebarError(props: { children?: ReactNode; className?: string }) {
  return <p className={className(popolaClass.sidebarError, props.className)}>{props.children}</p>
}

export function SidebarList(props: { children?: ReactNode; className?: string }) {
  return <ul className={className(popolaClass.sidebarList, props.className)}>{props.children}</ul>
}

export function SidebarItem(props: {
  title: string
  meta?: string
  /** Optional glyph / icon before the title (e.g. "+" or a folder mark). */
  leading?: ReactNode
  /** Native tooltip; defaults to `title`. */
  tooltip?: string
  selected?: boolean
  disabled?: boolean
  muted?: boolean
  onPress: () => void
  className?: string
}) {
  return (
    <li>
      <button
        type="button"
        title={props.tooltip ?? props.title}
        className={className(
          popolaClass.sidebarItem,
          props.selected ? popolaClass.sidebarItemSelected : undefined,
          props.className,
        )}
        disabled={props.disabled}
        aria-current={props.selected ? "page" : undefined}
        onClick={props.onPress}
      >
        {props.leading !== undefined && props.leading !== null ? (
          <span className={popolaClass.sidebarItemLeading} aria-hidden>
            {props.leading}
          </span>
        ) : null}
        <span className={popolaClass.sidebarItemBody}>
          <span
            className={className(
              popolaClass.sidebarItemTitle,
              props.muted ? popolaClass.sidebarItemTitleMuted : undefined,
            )}
          >
            {props.title}
          </span>
          {props.meta ? <span className={popolaClass.sidebarItemMeta}>{props.meta}</span> : null}
        </span>
      </button>
    </li>
  )
}
