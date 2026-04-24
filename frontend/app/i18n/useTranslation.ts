import { useI18n, type Translations } from './context'

type Namespace = keyof Translations
type NamespaceKey<NS extends Namespace> = keyof Translations[NS] & string

type Params = Record<string, string>

function interpolate(str: string, params: Params): string {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    Object.hasOwn(params, key) ? String(params[key]) : `{{${key}}}`,
  )
}

export function useTranslation<NS extends Namespace>(ns: NS) {
  const translations = useI18n()

  function t(key: NamespaceKey<NS>, params?: Params): string {
    const value = (translations[ns][key] as string) ?? key
    return params ? interpolate(value, params) : value
  }

  return t
}
