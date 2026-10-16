import type { defaultNS, fallbackNS } from './config.js'
import type resources from './locales/index.js'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS
    fallbackNS: typeof fallbackNS
    resources: (typeof resources)['en']
    keySeparator: false
  }
}
