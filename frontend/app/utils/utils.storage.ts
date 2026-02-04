import type {
  BannerProfile,
  WidgetProfile,
  ElementConfigType,
} from '@shared/types'
import { groupBy } from '@shared/utils'

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
    Object.entries(profile).filter(([key]) => !key.startsWith('$')),
    ([key]) => (isContentProperty(String(key)) ? 'content' : 'appearance'),
  )

  return {
    content: Object.fromEntries(content),
    appearance: Object.fromEntries(appearance),
  }
}

function isContentProperty(key: string): boolean {
  return key.endsWith('title') || key.endsWith('description')
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
