import type { TFunction } from "i18next"
import type { PopolaThemeOption } from "popola-ui-react"

/** Built-in light/dark/system plus host variants (see themes.css). */
export function getAppThemeOptions(t: TFunction): readonly PopolaThemeOption[] {
  return [
    { value: "system", label: t("theme.system") },
    { value: "light", label: t("theme.light") },
    { value: "dark", label: t("theme.dark") },
    { value: "claude", label: "Claude" },
    { value: "cursor", label: "Cursor" },
    { value: "deepseek", label: "DeepSeek" },
    { value: "gemini", label: "Gemini" },
    { value: "chatgpt", label: "ChatGPT" },
  ]
}
