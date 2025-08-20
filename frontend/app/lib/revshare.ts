const BASE_REVSHARE_POINTER = '$webmonetization.org/api/revshare/pay/'
const POINTER_LIST_PARAM = 'p'
const CHART_COLORS = [
  '#fae6f1',
  '#f5cce2',
  '#f0b3d4',
  '#eb99c6',
  '#e680b8',
  '#e066a9',
  '#db4d9b',
  '#d6338d',
  '#d11a7e',
  '#cc0070'
]

/** Represents a single revenue share participant */
export type Share = {
  /** An optional name for the recipient for display purposes */
  name?: string
  /** The payment pointer or wallet address of the recipient */
  pointer: string
  /** The numerical weight of the share, used to calculate the distribution */
  weight?: number
  /** The percentage of revenue this share should receive, if applicable */
  percent?: number
  /** Indicates if the share is valid, used for validation purposes */
  isValid?: boolean
}

/** Represents the state of all shares in the revenue distribution */
export type SharesState = Share[]

/**
 * Returns an array of valid shares, filtering out any shares that do not have a pointer or weight
 * @param shares - Array of shares to filter
 * @returns Array of shares that have both pointer and weight
 */
export function getValidShares(shares: Share[]): SharesState {
  return shares.filter((share) => share.pointer && Number(share.weight))
}

/**
 * Converts an array of Share objects into chart data suitable for rendering in a pie chart
 * @param shares - Array of shares to convert
 * @returns Array of chart data objects with title, value, and color properties
 */
export function sharesToChartData(
  shares: Share[]
): { title: string; value: number; color: string }[] {
  return getValidShares(shares).map((share, i) => ({
    title: share.name || share.pointer,
    value: Number(share.weight),
    color: CHART_COLORS[i % CHART_COLORS.length]
  }))
}

/**
 * Converts an array of Share objects into a list of payment pointers, weights, and names
 * @param shares - Array of shares to convert
 * @returns Array of tuples containing [pointer, weight, name]
 */
export function sharesToPointerList(
  shares: SharesState
): [string, number, string][] {
  return shares.flatMap((share) =>
    share.pointer && share.weight
      ? [[share.pointer, Number(share.weight), share.name || '']]
      : []
  )
}

/**
 * Converts a simplified pointer list back into an array of Share objects
 * @param pointerList - Array of tuples containing [pointer, weight, name]
 * @returns Array of Share objects
 */
export function sharesFromPointerList(
  pointerList: [string, number, string][]
): SharesState {
  return pointerList.map(([pointer, weight, name]) => ({
    pointer,
    weight,
    name
  }))
}

/**
 * Immutably updates a share at a specific index in the shares array
 * @param arr - The shares array to update
 * @param i - The index of the share to update
 * @param alteration - Partial share object containing the properties to update
 * @returns New shares array with the updated share
 */
export function changeList(
  arr: SharesState,
  i: number,
  alteration: Partial<Share>
): SharesState {
  return [
    ...arr.slice(0, i),
    Object.assign({}, arr[i], alteration),
    ...arr.slice(i + 1)
  ]
}

/**
 * Immutably removes a share from a specific index in the shares array
 * @param arr - The shares array to modify
 * @param i - The index of the share to remove
 * @returns New shares array with the share removed
 */
export function dropIndex(arr: SharesState, i: number): SharesState {
  return [...arr.slice(0, i), ...arr.slice(i + 1)]
}

/**
 * Calculates the required weight for a share to achieve a target percentage of the total
 * @param percent - The target percentage (0 to 1)
 * @param weight - The current weight of the share
 * @param totalWeight - The total weight of all shares
 * @returns The required weight to achieve the target percentage
 */
export function weightFromPercent(
  percent: number,
  weight: number,
  totalWeight: number
): number {
  return (-percent * (totalWeight - weight)) / (percent - 1)
}

/**
 * Encodes a string into a URL-safe base64 format
 * @param str - The string to encode
 * @returns URL-safe base64 encoded string
 */
export function base64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Decodes a URL-safe base64 string back to its original format
 * @param str - The URL-safe base64 string to decode
 * @returns Decoded original string
 */
export function fromBase64url(str: string): string {
  return atob(str.replace(/-/g, '+').replace(/_/g, '/'))
}

/**
 * Constructs a complete revshare payment pointer from an array of shares
 * @param shares - Array of shares to convert into a payment pointer
 * @returns Complete revshare payment pointer string, or undefined if no valid shares
 */
export function sharesToPaymentPointer(shares: Share[]): string | undefined {
  const validShares = getValidShares(shares)

  if (!validShares.length) {
    return
  }

  const pointerList = sharesToPointerList(validShares)
  const encodedShares = base64url(JSON.stringify(pointerList))

  return normalizePointerPrefix(BASE_REVSHARE_POINTER) + encodedShares
}

/**
 * Parses a rev-share payment pointer string to extract the shares
 * @param pointer - The payment pointer string to parse
 * @returns Array of Share objects extracted from the pointer
 * @throws Error if the pointer is malformed or contains invalid data
 */
export function pointerToShares(pointer: string): SharesState {
  try {
    const parsed = new URL(normalizePointerPrefix(pointer))
    const params = new URLSearchParams(parsed.search)

    // list could be in query string or in path segment
    const encodedList =
      params.get(POINTER_LIST_PARAM) || parsed.pathname.split('/').pop()

    if (!encodedList) {
      throw new Error(
        'No share data found. Make sure you copy the whole "content" field from your meta tag.'
      )
    }

    const pointerList = JSON.parse(fromBase64url(encodedList))

    if (!validatePointerList(pointerList)) {
      throw new Error(
        'Share data is invalid. Make sure you copy the whole "content" from your meta tag.'
      )
    }
    return sharesFromPointerList(pointerList as [string, number, string][])
  } catch (err: unknown) {
    if (err instanceof TypeError) {
      throw new Error('Meta tag or payment pointer is malformed')
    } else if (err instanceof SyntaxError) {
      throw new Error(
        'Payment pointer has malformed share data. Make sure to copy the entire pointer.'
      )
    } else {
      throw err
    }
  }
}

/**
 * Parses an HTML monetization tag (`<meta>` or `<link>`) to extract the shares
 * @param tag - The HTML tag string to parse
 * @returns Array of Share objects, or undefined if no valid monetization tag found
 * @throws Error if the tag is malformed
 */
export function tagToShares(tag: string): SharesState | undefined {
  const parser = new DOMParser()
  const node = parser.parseFromString(tag, 'text/html')
  const meta = node.head.querySelector(
    'meta[name="monetization"]'
  ) as HTMLMetaElement
  const link = node.head.querySelector(
    'link[rel="monetization"]'
  ) as HTMLLinkElement

  if (!meta && !link) {
    throw new Error(
      'Please enter the exact link tag you generated from this revshare tool. It seems to be malformed.'
    )
  }

  if (meta) {
    return pointerToShares(meta.content)
  }

  if (link) {
    return pointerToShares(link.href)
  }
}

/**
 * Checks if a string is a revshare payment pointer
 * @param str - The string to check
 * @returns True if the string is a revshare payment pointer
 */
function isRevsharePointer(str: string): boolean {
  return (
    str.startsWith(BASE_REVSHARE_POINTER) ||
    str.startsWith(normalizePointerPrefix(BASE_REVSHARE_POINTER))
  )
}

/**
 * Converts a tag or pointer string into an array of Share objects
 * @param tag - The HTML tag or payment pointer string to parse
 * @returns Array of Share objects, or undefined if parsing fails
 * @throws Error if the input is empty or malformed
 */
export function tagOrPointerToShares(tag: string): SharesState | undefined {
  const trimmedTag = tag.trim()
  if (!trimmedTag) {
    throw new Error('Field is empty')
  }

  if (isRevsharePointer(trimmedTag)) {
    return pointerToShares(trimmedTag)
  } else {
    return tagToShares(trimmedTag)
  }
}

/**
 * Trims a decimal number to 3 decimal places
 * @param dec - The decimal number to trim
 * @returns Number rounded to 3 decimal places
 */
export function trimDecimal(dec: number): number {
  return Number(dec.toFixed(3))
}

/**
 * Validates if a given pointer list is an array of [string, number, string?] tuples
 * @param pointerList - The value to validate
 * @returns True if the pointer list is valid, with type guard
 */
export function validatePointerList(
  pointerList: unknown
): pointerList is [string, number, string?][] {
  if (!Array.isArray(pointerList)) {
    return false
  }

  for (const entry of pointerList) {
    if (
      !Array.isArray(entry) ||
      typeof entry[0] !== 'string' ||
      typeof entry[1] !== 'number' ||
      (entry[2] !== undefined && typeof entry[2] !== 'string')
    ) {
      return false
    }
  }

  return true
}

/**
 * Normalizes a payment pointer prefix, converting `$` to `https://`
 * @param pointer - The payment pointer to normalize
 * @returns Payment pointer with https:// prefix
 */
export function normalizePointerPrefix(pointer: string): string {
  return pointer.startsWith('$') ? 'https://' + pointer.substring(1) : pointer
}

/**
 * Validates if a given pointer is a valid URL or payment pointer
 * @param pointer - The pointer string to validate (can be undefined)
 * @returns True if the pointer is valid or undefined, false otherwise
 */
export function validatePointer(pointer: string | undefined): boolean {
  if (!pointer) {
    return true
  }

  if (typeof pointer !== 'string') {
    return false
  }

  try {
    const _ = new URL(normalizePointerPrefix(pointer))
    return true
  } catch (_err) {
    return false
  }
}

/**
 * Validates if a given weight is a valid number greater than or equal to 0
 * @param weight - The weight value to validate (string, number, or undefined)
 * @returns True if the weight is valid (undefined, empty string, or non-negative number)
 */
export function validateWeight(weight: string | number | undefined): boolean {
  if (weight === undefined || weight === '') {
    return true
  }

  const num = Number(weight)
  return !Number.isNaN(num) && num >= 0
}

export function validateShares(shares: SharesState): boolean {
  return (
    Array.isArray(shares) &&
    shares.length > 0 &&
    shares.every((share) => share.isValid === true)
  )
}
