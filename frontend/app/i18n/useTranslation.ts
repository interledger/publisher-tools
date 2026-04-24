import { useI18n, type Translations } from './context'

type Namespace = keyof Translations
type GeneralKey = keyof Translations['general'] & string
type NamespaceKey<NS extends Namespace> = (
  | keyof Translations[NS]
  | GeneralKey
) &
  string

type Params = Record<string, string>

function interpolate(str: string, params: Params): string {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    Object.hasOwn(params, key) ? String(params[key]) : `{{${key}}}`,
  )
}

export function useTranslation<NS extends Namespace>(ns: NS) {
  const translations = useI18n()

  /** Translation result is plain text — safe in JSX, never pass to dangerouslySetInnerHTML or unsanitized href/src. */
  function t(key: NamespaceKey<NS>, params?: Params): string {
    const ns_translations = translations[ns] as Record<string, string>
    const general = translations.general as Record<string, string>
    const value = ns_translations[key] ?? general[key] ?? key

    return params ? interpolate(value, params) : value
  }

  return t
}
