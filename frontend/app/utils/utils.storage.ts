import type { Tool, ToolProfile } from '@shared/types'
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
    } else if (target[key] !== value) {
      target[key] = value as T[Extract<keyof T, string>]
    }
  }
}

export function parseWithShape<T extends object>(
  raw: string | null,
  shape: T,
): Partial<T> | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Object.keys(parsed).every((key) => key in shape)
    ) {
      return null
    }
    return parsed as Partial<T>
  } catch {
    return null
  }
}

/**
 * Listen for cross-tab localStorage writes. The `storage` event only fires
 * in *other* tabs, so this cannot echo our own writes.
 */
export function subscribeToStorage(
  handler: (event: StorageEvent) => void,
): () => void {
  const wrapped = (event: StorageEvent) => {
    if (event.storageArea && event.storageArea !== localStorage) return
    if (event.key === null || event.newValue === null) return
    handler(event)
  }
  window.addEventListener('storage', wrapped)
  return () => window.removeEventListener('storage', wrapped)
}

export function omit<T extends object>(
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
  return (
    key.endsWith('title') || key.endsWith('description') || key === 'ctaButton'
  )
}
