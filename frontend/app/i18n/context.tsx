import { createContext, useContext, type ReactNode } from 'react'
import en from './locales/en.json'

type Locale = 'en'

const locales = { en } as const

export type Translations = typeof en

const I18nContext = createContext<Translations>(locales.en)

interface I18nProviderProps {
  locale?: Locale
  children: ReactNode
}

export function I18nProvider({ locale = 'en', children }: I18nProviderProps) {
  return (
    <I18nContext.Provider value={locales[locale]}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
