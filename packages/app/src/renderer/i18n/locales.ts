/** Locales shipped with the app. */
export type SupportedLocale = "en" | "zh"

/** Preference stored by the host — `system` follows the OS when supported. */
export type AppLanguage = "system" | SupportedLocale

export interface LanguageOption {
  value: AppLanguage
  labelKey: string
}

export const DEFAULT_LOCALE: SupportedLocale = "en"

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: "system", labelKey: "language.options.system" },
  { value: "en", labelKey: "language.options.en" },
  { value: "zh", labelKey: "language.options.zh" },
]

/**
 * Resolve a preference against the OS locale list. Unsupported system languages
 * fall back to English.
 */
export function resolveSupportedLocale(
  language: AppLanguage,
  systemLocales: readonly string[],
): SupportedLocale {
  if (language !== "system") return language

  for (const locale of systemLocales) {
    const normalized = locale.toLowerCase()
    if (normalized === "zh" || normalized.startsWith("zh-")) return "zh"
    if (normalized === "en" || normalized.startsWith("en-")) return "en"
  }

  return DEFAULT_LOCALE
}
