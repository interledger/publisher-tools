import { useTranslation as useReactI18nextTranslation } from 'react-i18next'
import type { Translations } from './context.js'
import type { defaultNS } from './config.js'

export type { Translations }
export type Namespace = keyof Translations
export type GeneralKey = keyof Translations['general'] & string
export type NamespaceKey<NS extends Namespace> = (
  keyof Translations[NS] | GeneralKey
) &
  string

export type Params = Record<string, string | number>

export function useTranslation<NS extends Namespace = typeof defaultNS>(
  ns?: NS,
) {
  const { t: i18nextT, i18n } = useReactI18nextTranslation(ns)

  function t(key: NamespaceKey<NS>, params?: Params): string {
    return i18nextT(key as any, params as any)
  }

  t.i18n = i18n
  return t
}
