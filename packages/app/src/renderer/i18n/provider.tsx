import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { I18nextProvider } from "react-i18next"
import { i18n } from "./i18next"
import {
  DEFAULT_LOCALE,
  resolveSupportedLocale,
  type AppLanguage,
  type SupportedLocale,
} from "./locales"
import { ensureI18nLanguageForRender } from "./syncLanguage"

type AppLanguageContextValue = {
  language: AppLanguage
  locale: SupportedLocale
  setLanguage: (language: AppLanguage) => void
}

const AppLanguageContext = createContext<AppLanguageContextValue | null>(null)

function readSystemLocales(): string[] {
  if (typeof navigator === "undefined") return [DEFAULT_LOCALE]
  if (navigator.languages.length > 0) return [...navigator.languages]
  return [navigator.language || DEFAULT_LOCALE]
}

/**
 * Owns the language preference, resolves `system` against the OS, and syncs
 * i18next before children render (paseo `I18nProvider`).
 */
export function I18nProvider(props: { children?: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>("system")
  const [systemLocales, setSystemLocales] = useState(readSystemLocales)

  useEffect(() => {
    const sync = () => setSystemLocales(readSystemLocales())
    window.addEventListener("languagechange", sync)
    return () => window.removeEventListener("languagechange", sync)
  }, [])

  const locale = useMemo(
    () => resolveSupportedLocale(language, systemLocales),
    [language, systemLocales],
  )

  ensureI18nLanguageForRender(locale, i18n)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo<AppLanguageContextValue>(
    () => ({ language, locale, setLanguage }),
    [language, locale],
  )

  return (
    <AppLanguageContext.Provider value={value}>
      <I18nextProvider i18n={i18n}>{props.children}</I18nextProvider>
    </AppLanguageContext.Provider>
  )
}

/** Language preference + resolved locale. Translations come from `useTranslation`. */
export function useAppLanguage(): AppLanguageContextValue {
  const value = useContext(AppLanguageContext)
  if (!value) throw new Error("useAppLanguage must be used within I18nProvider")
  return value
}
