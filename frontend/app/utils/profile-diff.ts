import diff from 'microdiff'

export type ChangedFields = Partial<Record<`f.${string}`, boolean | string>>

// $version and $modifiedAt change on every save
const SKIPPED_KEYS = new Set(['$version', '$modifiedAt'])

export function diffProfile(prev: object, current: object): ChangedFields {
  const result: Record<string, boolean | string> = {}
  for (const d of diff(prev, current)) {
    if (d.type !== 'CHANGE') continue
    if (SKIPPED_KEYS.has(d.path[0] as string)) continue
    result[`f.${d.path.join('.')}`] =
      typeof d.value === 'string' ? lengthBucket(d.value) : true
  }
  return result as ChangedFields
}

function lengthBucket(s: string): string {
  const n = s.length
  if (n === 0) return '0'
  if (n <= 10) return '1-10'
  if (n <= 30) return '11-30'
  if (n <= 60) return '31-60'
  if (n <= 150) return '61-150'
  return '151+'
}
