import { resources } from './locales/index.js'

export type Locale = 'en'
export type Translations = (typeof resources)['en']

export function useI18n() {
  return resources.en
}
