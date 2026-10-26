import resources from './locales/index.js'

export const defaultNS = 'paywall' as const
export const fallbackNS = 'general' as const
export const defaultLanguage = 'en' as const
export const supportedLanguages = ['en'] as const

export const i18nConfig = {
  supportedLngs: supportedLanguages,
  fallbackLng: defaultLanguage,
  defaultNS,
  fallbackNS,
  resources,
  keySeparator: false as const,
  nsSeparator: ':' as const,
  interpolation: {
    escapeValue: false, // React already escapes values
  },
}
