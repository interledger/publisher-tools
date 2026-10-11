import { createI18nextMiddleware } from 'remix-i18next'
import { initReactI18next } from 'react-i18next'
import { i18nConfig, supportedLanguages, defaultLanguage } from './config.js'

export const [i18nextMiddleware, getLocale, getInstance] =
  createI18nextMiddleware({
    detection: {
      supportedLanguages: [...supportedLanguages],
      fallbackLanguage: defaultLanguage,
      order: ['searchParams', 'cookie', 'header'],
    },
    i18next: i18nConfig,
    plugins: [initReactI18next],
  })
