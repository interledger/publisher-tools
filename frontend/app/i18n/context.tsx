import { createContext, useContext, type ReactNode } from 'react'
import en from './locales/en.json'

export type Locale = 'en' | 'es'

const locales: Record<Locale, typeof en> = {
  en,
  es: en, // Fallback to en for other locales during transition
} as const

export type Translations = typeof en

interface I18nContextProps {
  locale: Locale
  translations: Translations
}

const I18nContext = createContext<I18nContextProps>({
  locale: 'en',
  translations: locales.en,
})
I18nContext.displayName = 'I18nContext'

interface I18nProviderProps {
  locale?: Locale
  children: ReactNode
}

export function I18nProvider({ locale = 'en', children }: I18nProviderProps) {
  const activeLocale = locales[locale] ? locale : 'en'
  return (
    <I18nContext.Provider value={{ locale: activeLocale, translations: locales[activeLocale] }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext).translations
}

export function useLocale() {
  return useContext(I18nContext).locale
}
