import { deepEqual } from 'fast-equals'

export type ChangedFields = Partial<Record<`field.${string}`, boolean | number>>

type ProfileLike = Record<string, unknown>

export function diffProfile(
  prev: object | undefined,
  current: object,
  atomicPaths?: ReadonlySet<string>,
): ChangedFields {
  const out: Record<string, boolean | number> = {}
  walk(
    prev as ProfileLike | undefined,
    current as ProfileLike,
    '',
    out,
    atomicPaths,
  )
  return out as ChangedFields
}

function walk(
  prev: ProfileLike | undefined,
  current: ProfileLike,
  path: string,
  out: Record<string, boolean | number>,
  atomicPaths: ReadonlySet<string> | undefined,
): void {
  for (const [key, b] of Object.entries(current)) {
    if (key.startsWith('$')) continue
    const fieldPath = path ? `${path}.${key}` : key
    const a = prev?.[key]
    const isObject = b !== null && typeof b === 'object' && !Array.isArray(b)
    const isAtomic = atomicPaths?.has(fieldPath) ?? false

    if (isObject && !isAtomic) {
      walk(
        a as ProfileLike | undefined,
        b as ProfileLike,
        fieldPath,
        out,
        atomicPaths,
      )
      continue
    }

    const changed = isAtomic ? !deepEqual(a, b) : a !== b
    if (changed) {
      out[`field.${fieldPath}`] =
        !isAtomic && typeof b === 'string' ? b.length : true
    }
  }
}
