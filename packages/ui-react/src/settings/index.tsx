import {
  Children,
  isValidElement,
  type InputHTMLAttributes,
  type ReactNode,
} from "react"
import { popolaClass } from "popola-ui"
import className from "licia/className"
import { POPOLA_THEME_OPTIONS, type PopolaTheme, type PopolaThemeOption } from "../context"

/**
 * Settings building blocks — iOS-style grouped lists and a desktop sidebar
 * split, matching the paseo settings primitives. Presentational only: no
 * store, no agent events.
 */

/**
 * Desktop split: sidebar on the left, detail pane on the right. Put a
 * {@link SettingsSidebar} in `sidebar` and a {@link SettingsPage} (or any
 * detail content) as children.
 */
export function SettingsLayout(props: {
  sidebar: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={className(popolaClass.settingsLayout, props.className)}>
      {props.sidebar}
      <div className={popolaClass.settingsDetail}>{props.children}</div>
    </div>
  )
}

export function SettingsSidebar(props: {
  header?: ReactNode
  children?: ReactNode
  className?: string
  "aria-label"?: string
}) {
  return (
    <nav
      className={className(popolaClass.settingsSidebar, props.className)}
      aria-label={props["aria-label"] ?? "Settings"}
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

/**
 * Bordered card that stacks rows. Separators are applied by class on each
 * child wrapper — never by DOM nesting in the stylesheet.
 */
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

export function SettingsSelect<Value extends string = string>(
  props: SettingsRowProps & {
    value: Value
    options: readonly SettingsSelectOption<Value>[]
    onValueChange: (value: Value) => void
    disabled?: boolean
  },
) {
  const { value, options, onValueChange, disabled, ...row } = props
  return (
    <SettingsRow {...row}>
      <select
        className={popolaClass.settingsSelect}
        value={value}
        disabled={disabled}
        aria-label={row.label}
        onChange={(event) => onValueChange(event.target.value as Value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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

/**
 * A pressable row that opens a detail. Label, optional summary, trailing chevron.
 */
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
 * Theme tiles with mini previews painted from `data-popola-theme` CSS tokens
 * (paseo ThemePicker). Four columns fill the card; System shows light | dark.
 * Pass `options` to include host schemes defined outside `popola-ui`.
 */
export function SettingsThemePicker(props: {
  value: PopolaTheme
  onValueChange: (value: PopolaTheme) => void
  options?: readonly PopolaThemeOption[]
  className?: string
  "aria-label"?: string
}) {
  const options = props.options ?? POPOLA_THEME_OPTIONS
  return (
    <div
      className={className(popolaClass.settingsTheme, props.className)}
      role="radiogroup"
      aria-label={props["aria-label"] ?? "Theme"}
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
