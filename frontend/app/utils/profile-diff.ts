export type ChangedFields = Partial<
  Record<`field.${string}`, boolean | string>
>

type PlainObject = Record<string, unknown>

// $version and $modifiedAt are system metadata; $name is user-editable (profile rename)
const SKIPPED_KEYS = new Set(['$version', '$modifiedAt'])

export function diffProfile(
  prev: object | undefined,
  current: object,
): ChangedFields {
  const result: Record<string, boolean | string> = {}
  walk(prev as PlainObject | undefined, current as PlainObject, '', result)
  return result as ChangedFields
}

function walk(
  prev: PlainObject | undefined,
  current: PlainObject,
  path: string,
  result: Record<string, boolean | string>,
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
        prevValue as PlainObject | undefined,
        currentValue as PlainObject,
        fieldPath,
        result,
      )
      continue
    }

    if (prevValue !== currentValue) {
      result[`field.${fieldPath}`] =
        typeof currentValue === 'string' ? currentValue : true
    }
  }
}
