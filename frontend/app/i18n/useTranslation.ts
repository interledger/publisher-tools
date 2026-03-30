import { useI18n, type Translations } from './context'

/**
 * Helper recursively builds all valid key paths from a nested translation object,
 * using `__` as the namespace separator so key names can freely contain `_`.
 * e.g. { a: { b_c: 'x' } } → 'a__b_c'
 */
type UnderscorePath<T, Acc extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Acc}${K}`
    : T[K] extends Record<string, unknown>
      ? UnderscorePath<T[K], `${Acc}${K}__`>
      : never
}[keyof T & string]

type TranslationKey = UnderscorePath<Translations>

type Params = Record<string, string>

function resolvePath(obj: unknown, path: string): string {
  let current: unknown = obj
  for (const segment of path.split('__')) {
    if (current === null || typeof current !== 'object') return path
    current = (current as Record<string, unknown>)[segment]
  }
  return typeof current === 'string' ? current : path
}

function interpolate(str: string, params: Params): string {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => params[key] ?? `{{${key}}}`)
}

export function useTranslation() {
  const translations = useI18n()

  function t(key: TranslationKey, params?: Params): string {
    const value = resolvePath(translations, key)
    return params ? interpolate(value, params) : value
  }

  return { t }
}
