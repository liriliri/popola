import {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import {
  ChevronDown,
  Copy,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Server,
  Trash2,
  X,
} from "lucide-react"
import {
  CUSTOM_PROVIDER_ID,
  filterProviderChooserOptions,
  popolaClass,
  type ProviderChooserOption,
} from "popola-ui"
import className from "licia/className"
import {
  POPOLA_THEME_OPTIONS,
  usePopola,
  usePortalTheme,
  type PopolaTheme,
  type PopolaThemeOption,
} from "../context"

/**
 * Settings building blocks: iOS-style grouped lists and a desktop sidebar split.
 * Purely presentational — no store, no agent events.
 */

/** Desktop split: {@link SettingsSidebar} in `sidebar`, detail content as children. */
export function SettingsLayout(props: {
  sidebar: ReactNode
  /** Pinned above the scrolling detail (e.g. a window drag strip). */
  header?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={className(popolaClass.settingsLayout, props.className)}>
      {props.sidebar}
      <div className={popolaClass.settingsDetail}>
        {props.header}
        <div className={popolaClass.settingsDetailScroll}>{props.children}</div>
      </div>
    </div>
  )
}

export function SettingsSidebar(props: {
  header?: ReactNode
  children?: ReactNode
  className?: string
  "aria-label"?: string
}) {
  const { labels } = usePopola()
  return (
    <nav
      className={className(popolaClass.settingsSidebar, props.className)}
      aria-label={props["aria-label"] ?? labels.settingsNav}
    >
      {props.header ? (
        <div className={popolaClass.settingsSidebarHeader}>{props.header}</div>
      ) : null}
      <div className={popolaClass.settingsSidebarBody}>{props.children}</div>
    </nav>
  )
}

export function SettingsSidebarGroup(props: {
  label?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={className(popolaClass.settingsSidebarGroup, props.className)}>
      {props.label ? (
        <div className={popolaClass.settingsSidebarGroupLabel}>{props.label}</div>
      ) : null}
      {props.children}
    </div>
  )
}

export function SettingsSidebarItem(props: {
  label: string
  selected?: boolean
  leading?: ReactNode
  disabled?: boolean
  onPress: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      className={className(
        popolaClass.settingsSidebarItem,
        props.selected ? popolaClass.settingsSidebarItemSelected : undefined,
        props.className,
      )}
      aria-current={props.selected ? "page" : undefined}
      disabled={props.disabled}
      onClick={props.onPress}
    >
      {props.leading ? (
        <span className={popolaClass.settingsSidebarItemLeading}>{props.leading}</span>
      ) : null}
      <span className={popolaClass.settingsSidebarItemLabel}>{props.label}</span>
    </button>
  )
}

/** Padded detail column inside {@link SettingsLayout}, or a standalone page. */
export function SettingsPage(props: { children?: ReactNode; className?: string }) {
  return <div className={className(popolaClass.settings, props.className)}>{props.children}</div>
}

export function SettingsGroup(props: {
  title: string
  trailing?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <section className={className(popolaClass.settingsGroup, props.className)}>
      <div className={popolaClass.settingsGroupHeader}>
        <h2 className={popolaClass.settingsGroupTitle}>{props.title}</h2>
        {props.trailing ? (
          <div className={popolaClass.settingsGroupTrailing}>{props.trailing}</div>
        ) : null}
      </div>
      {props.children}
    </section>
  )
}

export function SettingsSection(props: {
  title: string
  trailing?: ReactNode
  /** Drop the section's bottom margin when it is the last child of a group. */
  flush?: boolean
  children?: ReactNode
  className?: string
}) {
  return (
    <section
      className={className(
        popolaClass.settingsSection,
        props.flush ? popolaClass.settingsSectionFlush : undefined,
        props.className,
      )}
    >
      <div className={popolaClass.settingsSectionHeader}>
        <h3 className={popolaClass.settingsSectionTitle}>{props.title}</h3>
        {props.trailing ? (
          <div className={popolaClass.settingsSectionTrailing}>{props.trailing}</div>
        ) : null}
      </div>
      <div className={popolaClass.settingsSectionContent}>{props.children}</div>
    </section>
  )
}

/** Bordered card; separators come from a class on each child, not DOM nesting. */
export function SettingsCard(props: { children?: ReactNode; className?: string }) {
  return (
    <div className={className(popolaClass.settingsCard, props.className)}>
      {Children.toArray(props.children).map((child, index) => (
        <div
          key={isValidElement(child) ? child.key : index}
          className={className(
            popolaClass.settingsCardItem,
            index > 0 ? popolaClass.settingsCardItemBorder : undefined,
          )}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

export type SettingsRowProps = {
  label: string
  hint?: ReactNode
  error?: string | null
  leading?: ReactNode
  labelAccessory?: ReactNode
  children?: ReactNode
  className?: string
}

function SettingsRowLabel(props: {
  label: string
  labelAccessory?: ReactNode
}) {
  if (!props.labelAccessory) {
    return <span className={popolaClass.settingsRowLabel}>{props.label}</span>
  }
  return (
    <div className={popolaClass.settingsRowLabelRow}>
      <span className={popolaClass.settingsRowLabel}>{props.label}</span>
      {props.labelAccessory}
    </div>
  )
}

export function SettingsRow(props: SettingsRowProps) {
  return (
    <div className={className(popolaClass.settingsRow, props.className)}>
      {props.leading ? <div className={popolaClass.settingsRowLeading}>{props.leading}</div> : null}
      <div className={popolaClass.settingsRowContent}>
        <SettingsRowLabel label={props.label} labelAccessory={props.labelAccessory} />
        {typeof props.hint === "string" ? (
          <div className={popolaClass.settingsRowHint}>{props.hint}</div>
        ) : (
          props.hint
        )}
        {props.error ? (
          <div className={popolaClass.settingsRowError} role="alert">
            {props.error}
          </div>
        ) : null}
      </div>
      {props.children ? <div className={popolaClass.settingsRowControl}>{props.children}</div> : null}
    </div>
  )
}

export function SettingsSwitch(
  props: SettingsRowProps & {
    value: boolean
    onValueChange: (value: boolean) => void
    disabled?: boolean
  },
) {
  const { value, onValueChange, disabled, ...row } = props
  return (
    <SettingsRow {...row}>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={row.label}
        disabled={disabled}
        className={className(
          popolaClass.settingsSwitch,
          value ? popolaClass.settingsSwitchChecked : undefined,
        )}
        onClick={() => onValueChange(!value)}
      >
        <span
          className={className(
            popolaClass.settingsSwitchThumb,
            value ? popolaClass.settingsSwitchThumbChecked : undefined,
          )}
        />
      </button>
    </SettingsRow>
  )
}

export type SettingsSelectOption<Value extends string = string> = {
  label: string
  value: Value
}

function SelectChevron(props: { open?: boolean }) {
  return (
    <ChevronDown
      className={className(
        popolaClass.settingsSelectChevron,
        props.open ? popolaClass.settingsSelectChevronOpen : undefined,
      )}
      size={12}
      strokeWidth={2.5}
      aria-hidden
    />
  )
}

export function SettingsSelect<Value extends string = string>(
  props: SettingsRowProps & {
    value: Value
    options: readonly SettingsSelectOption<Value>[]
    onValueChange: (value: Value) => void
    disabled?: boolean
  },
) {
  const { value, options, onValueChange, disabled, ...row } = props
  const listId = useId()
  const portalTheme = usePortalTheme()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedIndex = options.findIndex((option) => option.value === value)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : options[0]

  const close = () => setOpen(false)

  const choose = (next: Value) => {
    onValueChange(next)
    close()
    triggerRef.current?.focus()
  }

  const openMenu = () => {
    if (disabled) return
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return

    const update = () => {
      const rect = triggerRef.current!.getBoundingClientRect()
      const gap = 4
      const width = Math.max(rect.width, 160)
      const spaceBelow = window.innerHeight - rect.bottom - gap
      const spaceAbove = rect.top - gap
      const preferBelow = spaceBelow >= 160 || spaceBelow >= spaceAbove
      const maxHeight = Math.max(80, Math.min(240, preferBelow ? spaceBelow : spaceAbove))
      const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8)
      const top = preferBelow
        ? rect.bottom + gap
        : Math.max(8, rect.top - gap - maxHeight)

      setMenuStyle({
        top,
        left,
        width,
        maxHeight,
      })
    }

    update()
    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, true)
    return () => {
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return
      close()
    }

    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open || !listRef.current) return
    const active = listRef.current.querySelector<HTMLElement>('[data-active="true"]')
    active?.scrollIntoView({ block: "nearest" })
  }, [open, activeIndex])

  const onTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return

    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      if (!open) {
        openMenu()
        return
      }
    }

    if (!open) return

    if (event.key === "Escape") {
      event.preventDefault()
      close()
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % options.length)
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + options.length) % options.length)
      return
    }

    if (event.key === "Home") {
      event.preventDefault()
      setActiveIndex(0)
      return
    }

    if (event.key === "End") {
      event.preventDefault()
      setActiveIndex(options.length - 1)
      return
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      const option = options[activeIndex]
      if (option) choose(option.value)
    }
  }

  const menu =
    open && menuStyle
      ? createPortal(
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-label={row.label}
            data-popola-theme={portalTheme}
            className={popolaClass.settingsSelectMenu}
            style={menuStyle}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value
              const isActive = index === activeIndex
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-active={isActive ? "true" : undefined}
                  className={className(
                    popolaClass.settingsSelectOption,
                    isActive ? popolaClass.settingsSelectOptionActive : undefined,
                    isSelected ? popolaClass.settingsSelectOptionSelected : undefined,
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(option.value)}
                >
                  {option.label}
                </button>
              )
            })}
          </div>,
          document.body,
        )
      : null

  return (
    <SettingsRow {...row}>
      <div ref={rootRef} className={popolaClass.settingsSelect}>
        <button
          ref={triggerRef}
          type="button"
          className={className(
            popolaClass.settingsSelectTrigger,
            open ? popolaClass.settingsSelectTriggerOpen : undefined,
          )}
          disabled={disabled}
          aria-label={row.label}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          onClick={() => (open ? close() : openMenu())}
          onKeyDown={onTriggerKeyDown}
        >
          <span className={popolaClass.settingsSelectValue}>{selected?.label ?? value}</span>
          <SelectChevron open={open} />
        </button>
        {menu}
      </div>
    </SettingsRow>
  )
}

export function SettingsInput(
  props: SettingsRowProps & {
    value: string
    onValueChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    type?: InputHTMLAttributes<HTMLInputElement>["type"]
    autoComplete?: string
    inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"]
  },
) {
  const { value, onValueChange, placeholder, disabled, type = "text", autoComplete, inputMode, ...row } =
    props

  return (
    <SettingsRow {...row}>
      <input
        className={popolaClass.settingsInput}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-label={row.label}
        onChange={(event) => onValueChange(event.target.value)}
      />
    </SettingsRow>
  )
}

export function SettingsAction(
  props: SettingsRowProps & {
    actionLabel: string
    onPress: () => void
    disabled?: boolean
  },
) {
  const { actionLabel, onPress, disabled, ...row } = props
  return (
    <SettingsRow {...row}>
      <button
        type="button"
        className={className(popolaClass.button)}
        disabled={disabled}
        onClick={onPress}
      >
        {actionLabel}
      </button>
    </SettingsRow>
  )
}

/** Label above a control — used in the provider-setup credentials grid. */
export function SettingsCredentialsField(props: {
  label: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={className(popolaClass.settingsCredentialsField, props.className)}>
      <div className={popolaClass.settingsCredentialsLabel}>{props.label}</div>
      {props.children}
    </div>
  )
}

/** Settled service chip; optional Change when the host still allows switching. */
export function SettingsServiceChip(props: {
  name: string
  detail?: string
  changeLabel?: string
  onChange?: () => void
  disabled?: boolean
  className?: string
}) {
  const letter = serviceMonogramLetter(props.name)
  return (
    <div className={className(popolaClass.settingsServiceChip, props.className)}>
      <span className={popolaClass.settingsServiceChipMonogram} aria-hidden>
        {letter || <Server size={12} strokeWidth={1.75} />}
      </span>
      <span className={popolaClass.settingsServiceChipCopy}>
        <span className={popolaClass.settingsServiceChipName}>{props.name}</span>
        {props.detail ? (
          <span className={popolaClass.settingsServiceChipHost} title={props.detail}>
            {props.detail}
          </span>
        ) : null}
      </span>
      {props.onChange && props.changeLabel ? (
        <button
          type="button"
          className={popolaClass.settingsServiceChipChange}
          disabled={props.disabled}
          onClick={props.onChange}
        >
          {props.changeLabel}
        </button>
      ) : null}
    </div>
  )
}

/** Pressable row opening a detail, with an optional summary and chevron. */
export function SettingsDetailRow(props: {
  label: string
  hint?: string
  summary?: string
  leading?: ReactNode
  labelAccessory?: ReactNode
  disabled?: boolean
  expanded?: boolean
  onPress: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      className={className(
        popolaClass.settingsRow,
        popolaClass.settingsRowPressable,
        props.disabled ? popolaClass.settingsRowDisabled : undefined,
        props.className,
      )}
      disabled={props.disabled}
      aria-label={props.summary ? `${props.label}, ${props.summary}` : props.label}
      aria-expanded={props.expanded}
      onClick={props.onPress}
    >
      {props.leading ? <div className={popolaClass.settingsRowLeading}>{props.leading}</div> : null}
      <div className={popolaClass.settingsRowContent}>
        <SettingsRowLabel label={props.label} labelAccessory={props.labelAccessory} />
        {props.hint ? <div className={popolaClass.settingsRowHint}>{props.hint}</div> : null}
      </div>
      <div className={popolaClass.settingsRowTrailing}>
        {props.summary ? (
          <span className={popolaClass.settingsRowSummary}>{props.summary}</span>
        ) : null}
        {props.disabled ? null : (
          <span
            className={className(
              popolaClass.settingsRowChevron,
              props.expanded ? popolaClass.settingsRowChevronExpanded : undefined,
            )}
            aria-hidden
          >
            ›
          </span>
        )}
      </div>
    </button>
  )
}

export function SettingsAddRow(props: {
  label: string
  onPress: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      className={className(
        popolaClass.settingsRow,
        popolaClass.settingsRowPressable,
        props.disabled ? popolaClass.settingsRowDisabled : undefined,
        props.className,
      )}
      disabled={props.disabled}
      aria-label={props.label}
      onClick={props.onPress}
    >
      <div className={popolaClass.settingsRowLeading} aria-hidden>
        +
      </div>
      <span className={className(popolaClass.settingsRowLabel, popolaClass.settingsRowLabelMuted)}>
        {props.label}
      </span>
    </button>
  )
}

/**
 * Theme tiles with previews painted from `data-popola-theme` tokens. Pass
 * `options` to add host schemes; System shows light | dark.
 */
export function SettingsThemePicker(props: {
  value: PopolaTheme
  onValueChange: (value: PopolaTheme) => void
  options?: readonly PopolaThemeOption[]
  className?: string
  "aria-label"?: string
}) {
  const { labels } = usePopola()
  const options = props.options ?? POPOLA_THEME_OPTIONS
  return (
    <div
      className={className(popolaClass.settingsTheme, props.className)}
      role="radiogroup"
      aria-label={props["aria-label"] ?? labels.themePicker}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={props.value === option.value}
          aria-label={option.label}
          className={className(
            popolaClass.settingsThemeTile,
            props.value === option.value ? popolaClass.settingsThemeTileSelected : undefined,
          )}
          onClick={() => props.onValueChange(option.value)}
        >
          <div className={popolaClass.settingsThemePreviewFrame}>
            {option.value === "system" ? (
              <SystemThemePreview />
            ) : (
              <ThemePreview scheme={option.value} />
            )}
          </div>
          <span className={popolaClass.settingsThemeLabel}>{option.label}</span>
        </button>
      ))}
    </div>
  )
}

function ThemePreview(props: { scheme: string }) {
  const line = (width: "wide" | "medium" | "narrow") =>
    className(
      popolaClass.settingsThemePreviewLine,
      popolaClass.settingsThemePreviewLineMuted,
      width === "wide"
        ? popolaClass.settingsThemePreviewLineWide
        : width === "medium"
          ? popolaClass.settingsThemePreviewLineMedium
          : popolaClass.settingsThemePreviewLineNarrow,
    )

  return (
    <div className={popolaClass.settingsThemePreview} data-popola-theme={props.scheme}>
      <div className={popolaClass.settingsThemePreviewSidebar} aria-hidden>
        <div className={line("wide")} />
        <div className={line("narrow")} />
        <div className={line("medium")} />
      </div>
      <div className={popolaClass.settingsThemePreviewMain} aria-hidden>
        <div className={popolaClass.settingsThemePreviewTitle} />
        <div className={line("wide")} />
        <div className={line("narrow")} />
        <div className={popolaClass.settingsThemePreviewBubble} />
      </div>
    </div>
  )
}

/** Light on the left half, dark on the right — matches OS “system” preference. */
function SystemThemePreview() {
  return (
    <div className={popolaClass.settingsThemePreview}>
      <ThemePreview scheme="light" />
      <div className={popolaClass.settingsThemePreviewSystemDark} aria-hidden>
        <div className={popolaClass.settingsThemePreviewSystemDarkInner}>
          <ThemePreview scheme="dark" />
        </div>
      </div>
    </div>
  )
}

const PROVIDER_TILE_SELECTOR = "[data-provider-tile]"

function providerMonogram(label: string): string {
  const trimmed = label.trim()
  if (!trimmed) return "?"
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase()
  }
  return trimmed.slice(0, 2).toUpperCase()
}

/**
 * Searchable preset tiles for picking an AI service. Filtering is local;
 * hosts pass localized {@link ProviderChooserOption} rows from `providerChooserOptions`.
 */
export function SettingsProviderChooser(props: {
  options: readonly ProviderChooserOption[]
  /** Highlight the service the form was showing. */
  current?: string
  searchPlaceholder: string
  emptyLabel: string
  emptyActionLabel: string
  disabled?: boolean
  onPick: (id: string) => void
  className?: string
}) {
  const [query, setQuery] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const visible = useMemo(
    () => filterProviderChooserOptions(props.options, query),
    [props.options, query],
  )

  const enterTarget = query.trim() ? visible[0]?.id : undefined

  const pick = (id: string) => {
    if (!props.disabled) props.onPick(id)
  }

  const tiles = () => [
    ...(gridRef.current?.querySelectorAll<HTMLButtonElement>(PROVIDER_TILE_SELECTOR) ?? []),
  ]

  const onTileKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const all = tiles()
    const index = all.indexOf(event.currentTarget)
    if (index === -1) return
    let next: HTMLButtonElement | undefined
    if (event.key === "ArrowRight") next = all[index + 1]
    else if (event.key === "ArrowLeft") next = all[index - 1]
    else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const down = event.key === "ArrowDown"
      const origin = event.currentTarget.getBoundingClientRect()
      const originX = origin.left + origin.width / 2
      let bestScore = Number.POSITIVE_INFINITY
      for (const tile of all) {
        const box = tile.getBoundingClientRect()
        const rowGap = down ? box.top - origin.bottom : origin.top - box.bottom
        if (rowGap < -1) continue
        const score = rowGap * 1000 + Math.abs(box.left + box.width / 2 - originX)
        if (score < bestScore) {
          bestScore = score
          next = tile
        }
      }
      if (!next && !down) {
        event.preventDefault()
        searchRef.current?.focus()
        return
      }
    } else return
    if (!next) return
    event.preventDefault()
    next.focus()
  }

  return (
    <div className={className(popolaClass.settingsProviderChooser, props.className)}>
      <div className={popolaClass.settingsProviderChooserSearch}>
        <Search
          className={popolaClass.settingsProviderChooserSearchIcon}
          size={14}
          strokeWidth={2}
          aria-hidden
        />
        <input
          ref={searchRef}
          className={popolaClass.settingsProviderChooserSearchInput}
          value={query}
          autoFocus
          autoComplete="off"
          disabled={props.disabled}
          placeholder={props.searchPlaceholder}
          aria-label={props.searchPlaceholder}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              pick(visible[0]?.id ?? CUSTOM_PROVIDER_ID)
            } else if (event.key === "ArrowDown") {
              event.preventDefault()
              tiles()[0]?.focus()
            }
          }}
        />
      </div>

      {visible.length === 0 ? (
        <div className={popolaClass.settingsProviderChooserEmpty}>
          <span>{props.emptyLabel}</span>
          <button
            type="button"
            className={popolaClass.settingsProviderChooserEmptyAction}
            disabled={props.disabled}
            onClick={() => pick(CUSTOM_PROVIDER_ID)}
          >
            {props.emptyActionLabel}
          </button>
        </div>
      ) : (
        <div ref={gridRef} className={popolaClass.settingsProviderChooserGrid}>
          {visible.map((option) => {
            const isCustom = option.id === CUSTOM_PROVIDER_ID
            return (
              <button
                key={option.id}
                type="button"
                data-provider-tile
                data-provider-id={option.id}
                className={className(
                  popolaClass.settingsProviderChooserTile,
                  enterTarget === option.id
                    ? popolaClass.settingsProviderChooserTileActive
                    : undefined,
                  option.id === props.current
                    ? popolaClass.settingsProviderChooserTileCurrent
                    : undefined,
                )}
                aria-current={option.id === props.current ? "true" : undefined}
                disabled={props.disabled}
                onKeyDown={onTileKeyDown}
                onClick={() => pick(option.id)}
              >
                <span className={popolaClass.settingsProviderChooserMonogram} aria-hidden>
                  {isCustom ? <Plus size={14} strokeWidth={2} /> : providerMonogram(option.label)}
                </span>
                <span className={popolaClass.settingsProviderChooserTileCopy}>
                  <span className={popolaClass.settingsProviderChooserTileName}>{option.label}</span>
                  <span className={popolaClass.settingsProviderChooserTileDetail}>
                    {option.detail}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Dual-pane model picker (PI ModelSelectionPanes): available catalog on the
 * left, chosen models on the right. Suggestions seed the left list; custom
 * ids can be typed into the right pane.
 */
export function SettingsModelPanes(props: {
  value: readonly string[]
  /** Catalog ids shown on the left even when unchecked (e.g. preset models). */
  suggestions?: readonly string[]
  onChange: (models: string[]) => void
  availableTitle: string
  chosenTitle: string
  searchAvailablePlaceholder: string
  searchChosenPlaceholder: string
  availableEmptyLabel: string
  chosenEmptyLabel: string
  noMatchLabel: string
  addPlaceholder: string
  addLabel: string
  removeLabel: string
  selectAllLabel: string
  deselectAllLabel: string
  onReload?: () => void
  reloading?: boolean
  canReload?: boolean
  reloadLabel?: string
  reloadingLabel?: string
  fetchError?: string | null
  fetchStatus?: string | null
  disabled?: boolean
  className?: string
}) {
  const [availableQuery, setAvailableQuery] = useState("")
  const [chosenQuery, setChosenQuery] = useState("")
  const [draft, setDraft] = useState("")
  const selected = useMemo(
    () => new Set(props.value.map((id) => id.toLowerCase())),
    [props.value],
  )

  const availableRows = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const id of props.suggestions ?? []) {
      const trimmed = id.trim()
      if (!trimmed) continue
      const key = trimmed.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(trimmed)
    }
    return out
  }, [props.suggestions])

  const visibleAvailable = useMemo(() => {
    const needle = availableQuery.trim().toLowerCase()
    if (!needle) return availableRows
    return availableRows.filter((id) => id.toLowerCase().includes(needle))
  }, [availableQuery, availableRows])

  const visibleChosen = useMemo(() => {
    const needle = chosenQuery.trim().toLowerCase()
    if (!needle) return [...props.value]
    return props.value.filter((id) => id.toLowerCase().includes(needle))
  }, [chosenQuery, props.value])

  const visibleSelectedCount = useMemo(
    () => visibleAvailable.filter((id) => selected.has(id.toLowerCase())).length,
    [selected, visibleAvailable],
  )
  const allVisibleSelected =
    visibleAvailable.length > 0 && visibleSelectedCount === visibleAvailable.length
  const someVisibleSelected =
    visibleSelectedCount > 0 && visibleSelectedCount < visibleAvailable.length

  useEffect(() => {
    if (props.value.length === 0) setChosenQuery("")
  }, [props.value.length])

  const toggle = (id: string) => {
    if (props.disabled) return
    const key = id.toLowerCase()
    if (selected.has(key)) {
      props.onChange(props.value.filter((item) => item.toLowerCase() !== key))
      return
    }
    props.onChange([...props.value, id])
  }

  const toggleVisible = (select: boolean) => {
    if (props.disabled) return
    const visibleKeys = new Set(visibleAvailable.map((id) => id.toLowerCase()))
    if (!select) {
      props.onChange(props.value.filter((id) => !visibleKeys.has(id.toLowerCase())))
      return
    }
    const next = [...props.value]
    const have = new Set(props.value.map((id) => id.toLowerCase()))
    for (const id of visibleAvailable) {
      const key = id.toLowerCase()
      if (have.has(key)) continue
      have.add(key)
      next.push(id)
    }
    props.onChange(next)
  }

  const remove = (id: string) => {
    if (props.disabled) return
    const key = id.toLowerCase()
    props.onChange(props.value.filter((item) => item.toLowerCase() !== key))
  }

  const add = () => {
    const id = draft.trim()
    if (!id || props.disabled) return
    if (!selected.has(id.toLowerCase())) props.onChange([...props.value, id])
    setDraft("")
    if (chosenQuery.trim() && !id.toLowerCase().includes(chosenQuery.trim().toLowerCase())) {
      setChosenQuery("")
    }
  }

  return (
    <div className={className(popolaClass.settingsModelPanes, props.className)}>
      <div className={popolaClass.settingsModelPane}>
        <div className={popolaClass.settingsModelPaneHead}>
          <div className={popolaClass.settingsModelPaneHeading}>
            {visibleAvailable.length > 0 ? (
              <input
                type="checkbox"
                className={popolaClass.settingsModelPaneCheck}
                checked={allVisibleSelected}
                disabled={props.disabled}
                ref={(el) => {
                  if (el) el.indeterminate = someVisibleSelected
                }}
                aria-label={allVisibleSelected ? props.deselectAllLabel : props.selectAllLabel}
                title={allVisibleSelected ? props.deselectAllLabel : props.selectAllLabel}
                onChange={(event) => toggleVisible(event.target.checked)}
              />
            ) : null}
            <h4 className={popolaClass.settingsModelPaneTitle}>{props.availableTitle}</h4>
            {props.onReload && props.reloadLabel ? (
              <button
                type="button"
                className={className(
                  popolaClass.settingsModelPaneReload,
                  props.reloading ? popolaClass.settingsModelPaneReloadLoading : undefined,
                )}
                disabled={
                  props.disabled || props.reloading || props.canReload === false
                }
                title={
                  props.canReload === false
                    ? props.availableEmptyLabel
                    : props.reloadLabel
                }
                onClick={props.onReload}
              >
                <RefreshCw size={13} strokeWidth={2} aria-hidden />
                {props.reloading
                  ? (props.reloadingLabel ?? props.reloadLabel)
                  : props.reloadLabel}
              </button>
            ) : null}
          </div>
          <div className={popolaClass.settingsModelPaneSearch}>
            <Search
              className={popolaClass.settingsModelPaneSearchIcon}
              size={13}
              strokeWidth={2}
              aria-hidden
            />
            <input
              className={popolaClass.settingsModelPaneSearchInput}
              value={availableQuery}
              placeholder={props.searchAvailablePlaceholder}
              aria-label={props.searchAvailablePlaceholder}
              disabled={props.disabled}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setAvailableQuery(event.target.value)}
            />
          </div>
        </div>

        {props.fetchError ? (
          <div
            className={className(
              popolaClass.settingsModelPaneStatus,
              popolaClass.settingsModelPaneStatusError,
            )}
            role="alert"
          >
            {props.fetchError}
          </div>
        ) : props.fetchStatus ? (
          <div className={popolaClass.settingsModelPaneStatus}>{props.fetchStatus}</div>
        ) : null}

        {props.reloading && availableRows.length === 0 ? (
          <div className={popolaClass.settingsModelPaneEmpty}>
            {props.reloadingLabel ?? props.reloadLabel}
          </div>
        ) : availableRows.length === 0 ? (
          <div className={popolaClass.settingsModelPaneEmpty}>{props.availableEmptyLabel}</div>
        ) : visibleAvailable.length === 0 ? (
          <div className={popolaClass.settingsModelPaneEmpty}>{props.noMatchLabel}</div>
        ) : (
          <ul className={popolaClass.settingsModelPaneList}>
            {visibleAvailable.map((id) => {
              const on = selected.has(id.toLowerCase())
              return (
                <li key={id} className={popolaClass.settingsModelPaneRow}>
                  <label className={popolaClass.settingsModelPaneRowLabel}>
                    <input
                      type="checkbox"
                      className={popolaClass.settingsModelPaneCheck}
                      checked={on}
                      disabled={props.disabled}
                      onChange={() => toggle(id)}
                    />
                    <span className={popolaClass.settingsModelPaneRowId}>{id}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className={popolaClass.settingsModelPane}>
        <div className={popolaClass.settingsModelPaneHead}>
          <div className={popolaClass.settingsModelPaneHeading}>
            <h4 className={popolaClass.settingsModelPaneTitle}>{props.chosenTitle}</h4>
            <span className={popolaClass.settingsModelPaneCount}>{props.value.length}</span>
          </div>
          <div className={popolaClass.settingsModelPaneSearch}>
            <Search
              className={popolaClass.settingsModelPaneSearchIcon}
              size={13}
              strokeWidth={2}
              aria-hidden
            />
            <input
              className={popolaClass.settingsModelPaneSearchInput}
              value={chosenQuery}
              placeholder={props.searchChosenPlaceholder}
              aria-label={props.searchChosenPlaceholder}
              disabled={props.disabled || props.value.length === 0}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setChosenQuery(event.target.value)}
            />
          </div>
        </div>

        {props.value.length === 0 ? (
          <div className={popolaClass.settingsModelPaneEmpty}>{props.chosenEmptyLabel}</div>
        ) : visibleChosen.length === 0 ? (
          <div className={popolaClass.settingsModelPaneEmpty}>{props.noMatchLabel}</div>
        ) : (
          <ul className={popolaClass.settingsModelPaneList}>
            {visibleChosen.map((id) => (
              <li key={id} className={popolaClass.settingsModelPaneChosenRow}>
                <span className={popolaClass.settingsModelPaneChosenId}>{id}</span>
                <button
                  type="button"
                  className={popolaClass.settingsModelPaneRemove}
                  aria-label={props.removeLabel}
                  title={props.removeLabel}
                  disabled={props.disabled}
                  onClick={() => remove(id)}
                >
                  <X size={12} strokeWidth={2} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className={popolaClass.settingsModelPaneCustom}>
          <input
            className={popolaClass.settingsModelPaneCustomInput}
            value={draft}
            placeholder={props.addPlaceholder}
            disabled={props.disabled}
            autoComplete="off"
            aria-label={props.addLabel}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                add()
              }
            }}
          />
          <button
            type="button"
            className={className(
              popolaClass.button,
              popolaClass.settingsModelPaneCustomButton,
            )}
            disabled={props.disabled || !draft.trim()}
            onClick={add}
          >
            <Plus size={14} strokeWidth={2.5} aria-hidden />
            {props.addLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Compact enable switch for service rows (PI SettingsToggle). */
export function SettingsToggle(props: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.checked}
      aria-label={props.label}
      disabled={props.disabled}
      className={className(
        popolaClass.settingsSwitch,
        props.checked ? popolaClass.settingsSwitchChecked : undefined,
        props.className,
      )}
      onClick={(event) => {
        event.stopPropagation()
        props.onChange(!props.checked)
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <span
        className={className(
          popolaClass.settingsSwitchThumb,
          props.checked ? popolaClass.settingsSwitchThumbChecked : undefined,
        )}
      />
    </button>
  )
}

export type SettingsContextMenuItem = {
  key: string
  label: string
  icon?: ReactNode
  danger?: boolean
  disabled?: boolean
  onSelect: () => void
}

export function SettingsContextMenu(props: {
  items: readonly SettingsContextMenuItem[]
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
      className={popolaClass.settingsContextMenu}
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
            popolaClass.settingsContextMenuItem,
            item.danger ? popolaClass.settingsContextMenuItemDanger : undefined,
          )}
          onClick={() => item.onSelect()}
        >
          {item.icon ? (
            <span className={popolaClass.settingsContextMenuItemIcon} aria-hidden>
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

export function PopolaDialog(props: {
  title: string
  children?: ReactNode
  actions?: ReactNode
  /** Wider fixed-height shell for the provider setup form. */
  setup?: boolean
  onClose: () => void
  className?: string
  "aria-label"?: string
}) {
  const theme = usePortalTheme()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        props.onClose()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [props.onClose])

  return createPortal(
    <div
      className={popolaClass.dialogLayer}
      role="presentation"
      data-popola-theme={theme}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) props.onClose()
      }}
    >
      <div
        className={className(
          popolaClass.dialog,
          props.setup ? popolaClass.dialogSetup : undefined,
          props.className,
        )}
        role="dialog"
        aria-modal="true"
        aria-label={props["aria-label"] ?? props.title}
      >
        <div className={popolaClass.dialogHead}>
          <h2 className={popolaClass.dialogTitle}>{props.title}</h2>
          {props.actions ? (
            <div className={popolaClass.dialogHeadActions}>{props.actions}</div>
          ) : null}
        </div>
        <div className={popolaClass.dialogBody}>{props.children}</div>
      </div>
    </div>,
    document.body,
  )
}

/** First letter/digit of a name for the quiet monogram tile (PI ServiceMonogram). */
function serviceMonogramLetter(name: string): string {
  const match = name.match(/[\p{L}\p{N}]/u)
  return match ? match[0]!.toLocaleUpperCase() : ""
}

export type SettingsServiceRowData = {
  id: string
  name: string
  /** Meta segments joined with · (e.g. model count, endpoint host). */
  meta: readonly string[]
  active?: boolean
  /** When false the row is dimmed and hidden from the composer picker. */
  enabled?: boolean
}

export function SettingsServicePanel(props: {
  title: string
  countLabel?: string
  addLabel: string
  emptyTitle: string
  emptyDescription: string
  enableLabel: string
  editLabel: string
  copyLabel: string
  deleteLabel: string
  deleteConfirmLabel: string
  rows: readonly SettingsServiceRowData[]
  busy?: boolean
  onAdd: () => void
  onOpen: (id: string) => void
  onCopy: (id: string) => void
  onRemove: (id: string) => void
  onToggleEnabled: (id: string, enabled: boolean) => void
  className?: string
}) {
  const [menu, setMenu] = useState<{
    id: string
    x: number
    y: number
  } | null>(null)
  const [armedDelete, setArmedDelete] = useState<string | null>(null)

  const closeMenu = () => {
    setMenu(null)
    setArmedDelete(null)
  }

  const openContextMenu = (event: ReactMouseEvent, rowId: string) => {
    if (props.busy) return
    event.preventDefault()
    event.stopPropagation()
    setArmedDelete(null)
    setMenu({ id: rowId, x: event.clientX, y: event.clientY })
  }

  const addButton = (
    <button
      type="button"
      className={className(popolaClass.button, popolaClass.buttonPrimary)}
      onClick={props.onAdd}
    >
      <span className={popolaClass.settingsBtnInner}>
        <Plus size={14} strokeWidth={2.5} aria-hidden />
        <span>{props.addLabel}</span>
      </span>
    </button>
  )

  const menuRow = menu ? props.rows.find((row) => row.id === menu.id) : null
  const deleteArmed = menu !== null && armedDelete === menu.id

  return (
    <div className={className(popolaClass.settingsModelPage, props.className)}>
      <section className={popolaClass.settingsCardBlock}>
        <div className={popolaClass.settingsModelSectionHead}>
          <div className={popolaClass.settingsCardHeadingLine}>
            <h3 className={popolaClass.settingsCardHeading}>{props.title}</h3>
            {props.countLabel ? (
              <span className={popolaClass.settingsSectionCount}>{props.countLabel}</span>
            ) : null}
          </div>
          <div className={popolaClass.settingsSectionHeadActions}>{addButton}</div>
        </div>

        <div className={popolaClass.settingsServicePanel}>
          {props.rows.length === 0 ? (
            <div className={popolaClass.settingsServiceEmpty}>
              <div className={popolaClass.settingsServiceEmptyIcon} aria-hidden>
                <Server size={18} strokeWidth={1.75} />
              </div>
              <div className={popolaClass.settingsServiceEmptyTitle}>{props.emptyTitle}</div>
              <div className={popolaClass.settingsServiceEmptyDesc}>{props.emptyDescription}</div>
              {addButton}
            </div>
          ) : (
            <ul className={popolaClass.settingsServiceList}>
              {props.rows.map((row) => {
                const letter = serviceMonogramLetter(row.name)
                const enabled = row.enabled !== false
                const menuOpen = menu?.id === row.id
                return (
                  <li
                    key={row.id}
                    className={className(
                      popolaClass.settingsServiceRow,
                      row.active ? popolaClass.settingsServiceRowActive : undefined,
                      enabled ? undefined : popolaClass.settingsServiceRowDisabled,
                      menuOpen ? popolaClass.settingsServiceRowMenuOpen : undefined,
                    )}
                    tabIndex={0}
                    onClick={() => {
                      if (menu) {
                        closeMenu()
                        return
                      }
                      props.onOpen(row.id)
                    }}
                    onContextMenu={(event) => openContextMenu(event, row.id)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return
                      if (event.target !== event.currentTarget) return
                      event.preventDefault()
                      props.onOpen(row.id)
                    }}
                  >
                    <span className={popolaClass.settingsServiceMonogram} aria-hidden>
                      {letter || <Server size={14} strokeWidth={1.75} />}
                    </span>
                    <span className={popolaClass.settingsServiceRowCopy}>
                      <span className={popolaClass.settingsServiceRowTitle}>
                        <span className={popolaClass.settingsServiceRowName}>{row.name}</span>
                      </span>
                      {row.meta.length > 0 ? (
                        <span className={popolaClass.settingsServiceRowMeta}>
                          {row.meta.map((part, index) => (
                            <Fragment key={`${row.id}-meta-${index}`}>
                              {index > 0 ? (
                                <span className={popolaClass.settingsServiceMetaDot} aria-hidden>
                                  ·
                                </span>
                              ) : null}
                              <span>{part}</span>
                            </Fragment>
                          ))}
                        </span>
                      ) : null}
                    </span>
                    <span className={popolaClass.settingsServiceRowActions}>
                      <SettingsToggle
                        checked={enabled}
                        label={props.enableLabel}
                        disabled={props.busy}
                        onChange={(next) => props.onToggleEnabled(row.id, next)}
                      />
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      {menu && menuRow ? (
        <SettingsContextMenu
          x={menu.x}
          y={menu.y}
          onClose={closeMenu}
          items={[
            {
              key: "edit",
              label: props.editLabel,
              icon: <Pencil size={14} strokeWidth={2} />,
              onSelect: () => {
                const id = menu.id
                closeMenu()
                props.onOpen(id)
              },
            },
            {
              key: "copy",
              label: props.copyLabel,
              icon: <Copy size={14} strokeWidth={2} />,
              onSelect: () => {
                const id = menu.id
                closeMenu()
                props.onCopy(id)
              },
            },
            {
              key: "remove",
              label: deleteArmed ? props.deleteConfirmLabel : props.deleteLabel,
              icon: <Trash2 size={14} strokeWidth={2} />,
              danger: true,
              onSelect: () => {
                if (!deleteArmed) {
                  setArmedDelete(menu.id)
                  return
                }
                const id = menu.id
                closeMenu()
                props.onRemove(id)
              },
            },
          ]}
        />
      ) : null}
    </div>
  )
}
