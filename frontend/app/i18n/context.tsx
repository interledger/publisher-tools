import { type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18next from './i18n.client.js'
import { resources } from './locales/index.js'

export type Locale = 'en'
export type Translations = (typeof resources)['en']

interface I18nProviderProps {
  locale?: Locale
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>
}

export function useI18n() {
  return resources.en
}
