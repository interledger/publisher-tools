import { initReactI18next } from 'react-i18next'
import { createInstance, type i18n as I18n } from 'i18next'
import { createI18nextMiddleware } from 'remix-i18next'
import { i18nConfig, supportedLanguages, defaultLanguage } from './config.js'

const [i18nextMiddleware, rawGetLocale, rawGetInstance] =
  createI18nextMiddleware({
    detection: {
      supportedLanguages: [...supportedLanguages],
      fallbackLanguage: defaultLanguage,
      order: ['searchParams', 'cookie', 'header'],
    },
    i18next: i18nConfig,
    plugins: [initReactI18next],
  })

let fallbackInstance: I18n | null = null

function getFallbackInstance(): I18n {
  if (!fallbackInstance) {
    fallbackInstance = createInstance(i18nConfig)
    fallbackInstance.use(initReactI18next)
    fallbackInstance.init({ lng: defaultLanguage })
  }
  return fallbackInstance
}

export function getInstance(
  context: Parameters<typeof rawGetInstance>[0],
): I18n {
  try {
    return rawGetInstance(context)
  } catch {
    return getFallbackInstance()
  }
}

export function getLocale(context: Parameters<typeof rawGetLocale>[0]): string {
  try {
    return rawGetLocale(context)
  } catch {
    return defaultLanguage
  }
}

export { i18nextMiddleware }
