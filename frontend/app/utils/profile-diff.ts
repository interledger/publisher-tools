import diff from 'microdiff'
import { ALL_SUGGESTED_TITLES } from '~/lib/presets'

export type ChangedFields = Partial<
  Record<`f.${string}`, boolean | number | string>
>

// $version and $modifiedAt change on every save
const SKIP = new Set(['$version', '$modifiedAt'])

type Buckets = readonly (readonly [max: number, label: string])[]

// Title fields cap at ~30–60 chars
const TITLE_BUCKETS: Buckets = [
  [0, '0'],
  [10, '1-10'],
  [20, '11-20'],
  [30, '21-30'],
  [60, '31-60'],
]
// Description fields cap at ~300 chars
const DESCRIPTION_BUCKETS: Buckets = [
  [0, '0'],
  [50, '1-50'],
  [150, '51-150'],
  [300, '151-300'],
]
// CTA text, profile names, and other short inputs
const NAME_BUCKETS: Buckets = [
  [0, '0'],
  [10, '1-10'],
  [30, '11-30'],
  [60, '31-60'],
]

export function diffProfile(prev: object, current: object): ChangedFields {
  const result: ChangedFields = {}
  for (const change of diff(prev, current)) {
    if (change.type !== 'CHANGE' || SKIP.has(change.path[0] as string)) continue
    result[`f.${change.path.join('.')}`] = encode(change.path, change.value)
  }
  return result
}

function encode(
  path: (string | number)[],
  value: unknown,
): boolean | number | string {
  if (typeof value === 'boolean' || typeof value === 'number') return value
  if (typeof value !== 'string') return JSON.stringify(value)
  const field = path.at(-1)
  const parent = path.at(-2)
  // color.text / colors.text are hex strings
  if (field === 'text' && parent !== 'color' && parent !== 'colors') {
    if (parent === 'title') {
      // Send preset titles as they are to know which one users picked
      return ALL_SUGGESTED_TITLES.has(value)
        ? value
        : bucket(value, TITLE_BUCKETS)
    }
    if (parent === 'description') return bucket(value, DESCRIPTION_BUCKETS)
    return bucket(value, NAME_BUCKETS)
  }
  if (path.length === 1 && field === '$name') return bucket(value, NAME_BUCKETS)
  return value === '' ? '(none)' : value
}

function bucket(value: string, buckets: Buckets): string {
  for (const [max, label] of buckets) if (value.length <= max) return label
  return `${buckets[buckets.length - 1][0]}+`
}
