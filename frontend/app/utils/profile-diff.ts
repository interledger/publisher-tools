export type ChangedFields = Partial<Record<`field.${string}`, boolean | number>>

type ProfileLike = Record<string, unknown>

// $version and $modifiedAt are system metadata; $name is user-editable (profile rename)
const SKIPPED_KEYS = new Set(['$version', '$modifiedAt'])

export function diffProfile(
  prev: object | undefined,
  current: object,
): ChangedFields {
  const result: Record<string, boolean | number> = {}
  walk(prev as ProfileLike | undefined, current as ProfileLike, '', result)
  return result as ChangedFields
}

function walk(
  prev: ProfileLike | undefined,
  current: ProfileLike,
  path: string,
  result: Record<string, boolean | number>,
): void {
  for (const [key, currentValue] of Object.entries(current)) {
    if (SKIPPED_KEYS.has(key)) continue
    const fieldPath = path ? `${path}.${key}` : key
    const prevValue = prev?.[key]
    const isObject =
      currentValue !== null &&
      typeof currentValue === 'object' &&
      !Array.isArray(currentValue)

    if (isObject) {
      walk(
        prevValue as ProfileLike | undefined,
        currentValue as ProfileLike,
        fieldPath,
        result,
      )
      continue
    }

    if (prevValue !== currentValue) {
      // string length instead of value
      result[`field.${fieldPath}`] =
        typeof currentValue === 'string' ? currentValue.length : true
    }
  }
}
