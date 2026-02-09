import type {
  BannerProfile,
  WidgetProfile,
  ElementConfigType,
} from '@shared/types'
import { groupBy } from '@shared/utils'

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

/**
 * recursively mutating each property in place so valtio can track the changes
 */
export function patchProxy<T extends object>(
  target: T,
  source: DeepPartial<T>,
): void {
  for (const key in source) {
    const value = source[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      patchProxy(target[key] as object, value as object)
    } else {
      target[key] = value as T[Extract<keyof T, string>]
    }
  }
}

export function omit<T extends Record<string, unknown>>(
  obj: T,
  keys: readonly (keyof T | string)[] | Set<keyof T | string>,
): Partial<T> {
  const excludedKeys = keys instanceof Set ? keys : new Set(keys)

  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !excludedKeys.has(key)),
  ) as Partial<T>
}

export function splitProfileProperties(profile: BannerProfile | WidgetProfile) {
  const { content = [], appearance = [] } = groupBy(
    Object.entries(profile),
    ([key]) => (isContentProperty(String(key)) ? 'content' : 'appearance'),
  )

  return {
    content: Object.fromEntries(content),
    appearance: Object.fromEntries(appearance),
  }
}

function isContentProperty(key: string): boolean {
  return key.endsWith('Text') || key.endsWith('Visible')
}

// TODO: remove with versioning changes
export function legacySplitConfigProperties<T extends ElementConfigType>(
  config: T,
) {
  const { versionName: _versionName, ...rest } = config
  const { content = [], appearance = [] } = groupBy(
    Object.entries(rest),
    ([key]) => (isContentProperty(String(key)) ? 'content' : 'appearance'),
  )

  return {
    content: Object.fromEntries(content) as Partial<T>,
    appearance: Object.fromEntries(appearance) as Partial<T>,
  }
}
