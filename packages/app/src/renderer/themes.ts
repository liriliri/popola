import { POPOLA_THEME_OPTIONS, type PopolaThemeOption } from "popola-ui-react"

/** Built-in light/dark/system plus host variants (see themes.css). */
export const APP_THEME_OPTIONS: readonly PopolaThemeOption[] = [
  ...POPOLA_THEME_OPTIONS,
  { value: "zinc", label: "Zinc" },
  { value: "midnight", label: "Midnight" },
  { value: "claude", label: "Claude" },
  { value: "ghostty", label: "Ghostty" },
  { value: "pure-black", label: "Pure Black" },
]
