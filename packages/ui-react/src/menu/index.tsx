import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { popolaClass } from "popola-ui"
import className from "licia/className"
import { usePortalTheme } from "../context"

export type PopolaContextMenuItem = {
  key: string
  label: string
  icon?: ReactNode
  danger?: boolean
  disabled?: boolean
  onSelect: () => void
}

/** Fixed-position portal menu. Host opens it at a pointer point and closes on Esc / outside click. */
export function PopolaContextMenu(props: {
  items: readonly PopolaContextMenuItem[]
  x: number
  y: number
  onClose: () => void
}) {
  const portalTheme = usePortalTheme()
  const menuRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<CSSProperties>({
    position: "fixed",
    top: props.y,
    left: props.x,
    width: 180,
  })

  useLayoutEffect(() => {
    const el = menuRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pad = 8
    let left = props.x
    let top = props.y
    if (left + rect.width > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - rect.width - pad)
    }
    if (top + rect.height > window.innerHeight - pad) {
      top = Math.max(pad, window.innerHeight - rect.height - pad)
    }
    left = Math.max(pad, left)
    top = Math.max(pad, top)
    setStyle({ position: "fixed", top, left, width: 180 })
  }, [props.x, props.y, props.items])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        props.onClose()
      }
    }
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return
      props.onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("mousedown", onPointerDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("mousedown", onPointerDown)
    }
  }, [props.onClose])

  return createPortal(
    <div
      ref={menuRef}
      className={popolaClass.contextMenu}
      role="menu"
      style={style}
      data-popola-theme={portalTheme}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      {props.items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          className={className(
            popolaClass.contextMenuItem,
            item.danger ? popolaClass.contextMenuItemDanger : undefined,
          )}
          onClick={() => item.onSelect()}
        >
          {item.icon ? (
            <span className={popolaClass.contextMenuItemIcon} aria-hidden>
              {item.icon}
            </span>
          ) : null}
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  )
}
