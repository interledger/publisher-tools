export function omit<T extends Record<string, unknown>>(
  obj: T,
  keys: readonly (keyof T | string)[] | Set<keyof T | string>
): Partial<T> {
  const excludedKeys = keys instanceof Set ? keys : new Set(keys)

  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !excludedKeys.has(key))
  ) as Partial<T>
}
