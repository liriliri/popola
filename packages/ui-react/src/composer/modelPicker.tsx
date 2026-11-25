import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown, Search } from "lucide-react"
import {
  filterComposerModelRows,
  flattenComposerModelGroups,
  groupComposerModelRows,
  popolaClass,
  type ComposerModelGroup,
} from "popola-ui"
import className from "licia/className"
import { usePopola, usePortalTheme } from "../context"

export type ComposerModelSelection = {
  providerId: string
  modelId: string
}

const MARGIN = 8
const GAP = 6

/**
 * Chip + menu for picking a provider account and model, patterned after
 * PI-Desktop's composer model menu. Hosts pass configured groups; selection
 * is reported up and never stored here.
 */
export function ComposerModelPicker(props: {
  groups: readonly ComposerModelGroup[]
  selectedProviderId?: string
  selectedModelId?: string
  disabled?: boolean
  searchPlaceholder?: string
  emptyLabel?: string
  ariaLabel?: string
  onSelect: (selection: ComposerModelSelection) => void
  className?: string
}) {
  const { labels } = usePopola()
  const portalTheme = usePortalTheme()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const chipRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selectedGroup = props.groups.find((group) => group.providerId === props.selectedProviderId)
  const selectedModel =
    selectedGroup?.models.find((model) => model.id === props.selectedModelId) ??
    selectedGroup?.models[0]
  const chipModel = selectedModel?.label ?? props.selectedModelId ?? labels.composerModel
  const chipProvider = selectedGroup?.providerLabel

  const visibleGroups = useMemo(() => {
    const flat = flattenComposerModelGroups(props.groups)
    return groupComposerModelRows(filterComposerModelRows(flat, query))
  }, [props.groups, query])

  const close = useCallback(() => {
    setOpen(false)
    setQuery("")
  }, [])

  useEffect(() => {
    if (!open) setPosition(null)
  }, [open])

  // PI AnchoredMenu: measure the portaled surface, then place it above the chip.
  const updatePosition = useCallback(() => {
    const anchor = chipRef.current
    const menu = menuRef.current
    if (!anchor || !menu) return
    const anchorRect = anchor.getBoundingClientRect()
    if (anchorRect.bottom <= 0 || anchorRect.top >= window.innerHeight) {
      close()
      return
    }
    const menuWidth = menu.offsetWidth
    const menuHeight = menu.offsetHeight
    const maxLeft = Math.max(MARGIN, window.innerWidth - menuWidth - MARGIN)
    const left = Math.min(Math.max(MARGIN, anchorRect.left), maxLeft)
    const below = anchorRect.bottom + GAP
    const above = anchorRect.top - menuHeight - GAP
    const maxTop = Math.max(MARGIN, window.innerHeight - menuHeight - MARGIN)
    const preferredFits = above >= MARGIN && above <= maxTop
    const fallbackFits = below >= MARGIN && below <= maxTop
    const top = preferredFits
      ? above
      : fallbackFits
        ? below
        : Math.min(Math.max(MARGIN, above), maxTop)
    setPosition((previous) =>
      previous && previous.top === top && previous.left === left
        ? previous
        : { top, left },
    )
  }, [close])

  useLayoutEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(updatePosition)
    return () => window.cancelAnimationFrame(frame)
  }, [open, visibleGroups, query, updatePosition])

  useEffect(() => {
    if (!open || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(updatePosition)
    if (menuRef.current) observer.observe(menuRef.current)
    if (chipRef.current) observer.observe(chipRef.current)
    return () => observer.disconnect()
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      close()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.preventDefault()
      close()
    }
    const onViewportChange = (event: Event) => {
      const target = event.target
      if (target instanceof Node && menuRef.current?.contains(target)) return
      updatePosition()
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    window.addEventListener("resize", onViewportChange)
    window.addEventListener("scroll", onViewportChange, true)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("resize", onViewportChange)
      window.removeEventListener("scroll", onViewportChange, true)
    }
  }, [open, close, updatePosition])

  useEffect(() => {
    if (!open || !position) return
    searchRef.current?.focus()
  }, [open, position])

  const pick = (providerId: string, modelId: string) => {
    props.onSelect({ providerId, modelId })
    close()
  }

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          className={className(
            popolaClass.composerModelMenu,
            position ? popolaClass.composerModelMenuOpen : undefined,
          )}
          role="menu"
          data-popola-theme={portalTheme}
          style={
            position
              ? { top: position.top, left: position.left }
              : undefined
          }
        >
          <label className={popolaClass.composerModelSearch}>
            <Search
              className={popolaClass.composerModelSearchIcon}
              size={14}
              strokeWidth={2}
              aria-hidden
            />
            <input
              ref={searchRef}
              className={popolaClass.composerModelSearchInput}
              value={query}
              placeholder={props.searchPlaceholder ?? labels.composerSearchModels}
              aria-label={props.searchPlaceholder ?? labels.composerSearchModels}
              spellCheck={false}
              autoComplete="off"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <div className={popolaClass.composerModelBody}>
            {visibleGroups.length === 0 ? (
              <div className={popolaClass.composerModelEmpty}>
                {props.emptyLabel ?? labels.composerNoModels}
              </div>
            ) : (
              visibleGroups.map((group) => (
                <section key={group.providerId} className={popolaClass.composerModelGroup}>
                  <h4 className={popolaClass.composerModelGroupTitle}>{group.providerLabel}</h4>
                  {group.models.map((model) => {
                    const active =
                      group.providerId === props.selectedProviderId &&
                      model.id === props.selectedModelId
                    return (
                      <button
                        key={`${group.providerId}:${model.id}`}
                        type="button"
                        role="menuitemradio"
                        aria-checked={active}
                        className={className(
                          popolaClass.composerModelOption,
                          active ? popolaClass.composerModelOptionActive : undefined,
                        )}
                        onClick={() => pick(group.providerId, model.id)}
                      >
                        <span className={popolaClass.composerModelOptionLabel}>{model.label}</span>
                        {active ? (
                          <Check
                            className={popolaClass.composerModelOptionCheck}
                            size={13}
                            strokeWidth={2.5}
                            aria-hidden
                          />
                        ) : null}
                      </button>
                    )
                  })}
                </section>
              ))
            )}
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <div ref={rootRef} className={className(popolaClass.composerModelPicker, props.className)}>
      <button
        ref={chipRef}
        type="button"
        className={className(
          popolaClass.composerModelChip,
          open ? popolaClass.composerModelChipOpen : undefined,
        )}
        disabled={props.disabled || props.groups.length === 0}
        aria-label={props.ariaLabel ?? labels.composerModel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => {
            if (current) setQuery("")
            return !current
          })
        }}
      >
        <span className={popolaClass.composerModelChipLabel}>{chipModel}</span>
        {chipProvider ? (
          <span className={popolaClass.composerModelChipProvider}>{chipProvider}</span>
        ) : null}
        <ChevronDown
          className={popolaClass.composerModelChipChevron}
          size={12}
          strokeWidth={2.5}
          aria-hidden
        />
      </button>
      {menu}
    </div>
  )
}

/** Convenience wrapper for the leading composer actions cluster. */
export function ComposerToolbar(props: { children?: ReactNode; className?: string }) {
  return (
    <div className={className(popolaClass.composerToolbar, props.className)}>{props.children}</div>
  )
}
