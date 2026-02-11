import type { Tool, ToolProfile, WidgetProfile } from '@shared/types'
import { groupBy } from '@shared/utils'

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

/**
 * Recursively assigns properties from `source` onto a valtio `target` proxy,
 * mutating each property **in place** rather than replacing nested objects.
 *
 * Why not `Object.assign`?
 * Valtio wraps every nested object in its own proxy. If you replace a nested
 * object wholesale (e.g. `target.nested = { ... }`), the old proxy is
 * discarded and any existing subscriptions / `useSnapshot` hooks that
 * reference it will stop receiving updates.
 *
 * By walking the tree and only writing leaf values, the original proxy
 * references are preserved and valtio can track every change.
 *
 * @see https://valtio.dev/docs/how-tos/how-valtio-works
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

export function splitProfileProperties<T extends Tool>(
  profile: ToolProfile<T>,
) {
  if (!profile) {
    throw new Error('No profile provided')
  }

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
export function legacySplitConfigProperties<T extends WidgetProfile>(
  config: T,
) {
  const { $name: _versionName, ...rest } = config
  const { content = [], appearance = [] } = groupBy(
    Object.entries(rest),
    ([key]) =>
      legacyIsContentProperty(String(key)) ? 'content' : 'appearance',
  )

  return {
    content: Object.fromEntries(content) as Partial<T>,
    appearance: Object.fromEntries(appearance) as Partial<T>,
  }
}

function legacyIsContentProperty(key: string): boolean {
  return key.endsWith('Text') || key.endsWith('Visible')
}
