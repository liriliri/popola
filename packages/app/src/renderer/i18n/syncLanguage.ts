import type { SupportedLocale } from "./locales"

interface I18nLanguageController {
  language?: string
  changeLanguage: (language: SupportedLocale) => Promise<unknown>
}

/** Keep i18n's active language in sync before children render. */
export function ensureI18nLanguageForRender(
  locale: SupportedLocale,
  i18n: I18nLanguageController,
): void {
  if (i18n.language === locale) return

  void i18n
    .changeLanguage(locale)
    .catch((error) => console.error("[i18n] Failed to change language", error))
}
