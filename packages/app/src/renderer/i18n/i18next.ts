import { createInstance } from "i18next"
import { initReactI18next } from "react-i18next"
import { DEFAULT_LOCALE } from "./locales"
import { en } from "./resources/en"
import { zh } from "./resources/zh"

const i18n = createInstance()

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
  },
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
})

export { i18n }
