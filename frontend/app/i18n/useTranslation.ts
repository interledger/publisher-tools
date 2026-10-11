import { useTranslation as useReactI18nextTranslation } from 'react-i18next'
import type { defaultNS } from './config.js'
import type { Translations } from './context.js'

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
    const translate = i18nextT as unknown as (
      key: string,
      params?: Params,
    ) => string
    return translate(key, params)
  }

  t.i18n = i18n
  return t
}
