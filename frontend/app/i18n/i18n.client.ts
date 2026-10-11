import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { i18nConfig, defaultLanguage } from './config.js'

export function initI18nClient(initialLng: string = defaultLanguage) {
  if (!i18next.isInitialized) {
    i18next.use(initReactI18next).init({
      ...i18nConfig,
      lng: initialLng,
    })
  } else if (initialLng && i18next.language !== initialLng) {
    i18next.changeLanguage(initialLng)
  }
  return i18next
}

if (!i18next.isInitialized) {
  const initialLng =
    typeof document !== 'undefined' && document.documentElement.lang
      ? document.documentElement.lang
      : defaultLanguage

  initI18nClient(initialLng)
}

export default i18next
