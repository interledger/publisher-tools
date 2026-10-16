import { useTranslation as useReactI18nextTranslation } from 'react-i18next'
import type { defaultNS } from './config.js'
import type { Translations } from './context.js'

export type { Translations }
export type Namespace = keyof Translations

export function useTranslation<NS extends Namespace = typeof defaultNS>(
  ns?: NS,
) {
  const { t } = useReactI18nextTranslation(ns)
  return t
}
