import { deepEqual } from 'fast-equals'

export type ChangedFields = Partial<Record<`field.${string}`, boolean | number>>

type ProfileLike = Record<string, unknown>

// $version and $modifiedAt are system metadata $name is user-editable (profile rename)
const SKIPPED_KEYS = new Set(['$version', '$modifiedAt'])

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
  for (const [key, currValue] of Object.entries(current)) {
    if (SKIPPED_KEYS.has(key)) continue
    const fieldPath = path ? `${path}.${key}` : key
    const prevValue = prev?.[key]
    const isObject =
      currValue !== null &&
      typeof currValue === 'object' &&
      !Array.isArray(currValue)
    const isAtomic = atomicPaths?.has(fieldPath) ?? false

    if (isObject && !isAtomic) {
      walk(
        prevValue as ProfileLike | undefined,
        currValue as ProfileLike,
        fieldPath,
        out,
        atomicPaths,
      )
      continue
    }

    const changed = isAtomic
      ? !deepEqual(prevValue, currValue)
      : prevValue !== currValue
    if (changed) {
      out[`field.${fieldPath}`] =
        !isAtomic && typeof currValue === 'string' ? currValue.length : true
    }
  }
}
