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

/**
 * @typedef {object} Share
 * Represents a single revenue share participant.
 * @property {string} [name] - An optional name for the recipient for display purposes.
 * @property {string} pointer - The payment pointer of the recipient.
 * @property {number} [weight] - The numerical weight of the share, used to calculate the distribution.
 * @property {number} [percent] - The calculated percentage of the total revenue for this share.
 */
export type Share = {
  name?: string
  pointer: string
  weight?: number
  percent?: number
}

/**
 * @typedef {Share[]} SharesState
 * Represents the state of all shares in the revenue distribution.
 */
export type SharesState = Share[]

/**
 * Filters an array of shares, returning only those that are valid for processing.
 * A valid share must have a payment pointer and a numeric weight.
 * @param {Share[]} shares - The array of Share objects to filter.
 * @returns {SharesState} A new array containing only the valid shares.
 */
export function getValidShares(shares: Share[]): SharesState {
  return shares.filter((share) => share.pointer && Number(share.weight))
}

/**
 * Transforms an array of shares into a data structure suitable for chart rendering.
 * @param {Share[]} shares - The array of Share objects.
 * @returns {{title: string, value: number, color: string}[]} An array of objects for charting.
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
 * Converts an array of Share objects into a simplified list format for encoding.
 * The format is an array of tuples: `[pointer, weight, name]`.
 * @param {SharesState} shares - The array of Share objects.
 * @returns {[string, number, string][]} A simplified list representation of the shares.
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
 * Converts a simplified pointer list back into an array of Share objects.
 * @param {[string, number, string][]} pointerList - The pointer list in `[pointer, weight, name]` format.
 * @returns {SharesState} An array of Share objects.
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
 * Immutably updates a share at a specific index in the shares array.
 * @param {SharesState} arr - The original array of shares.
 * @param {number} i - The index of the share to update.
 * @param {Partial<Share>} alteration - An object with the properties to change.
 * @returns {SharesState} A new array with the updated share.
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
 * Immutably removes a share from a specific index in the shares array.
 * @param {SharesState} arr - The original array of shares.
 * @param {number} i - The index of the share to remove.
 * @returns {SharesState} A new array without the removed share.
 */
export function dropIndex(arr: SharesState, i: number): SharesState {
  return [...arr.slice(0, i), ...arr.slice(i + 1)]
}

/**
 * Calculates the required weight for a share to achieve a target percentage of the total.
 * @param {number} percent - The desired percentage (e.g., 0.5 for 50%).
 * @param {number} weight - The current weight of the share being adjusted.
 * @param {number} totalWeight - The current total weight of all shares.
 * @returns {number} The new weight required to meet the percentage.
 */
export function weightFromPercent(
  percent: number,
  weight: number,
  totalWeight: number
): number {
  return (-percent * (totalWeight - weight)) / (percent - 1)
}

/**
 * Encodes a string into a URL-safe base64 format.
 * @param {string} str - The string to encode.
 * @returns {string} The URL-safe base64 encoded string.
 */
export function base64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Decodes a URL-safe base64 string back to its original format.
 * @param {string} str - The URL-safe base64 encoded string.
 * @returns {string} The decoded string.
 */
export function fromBase64url(str: string): string {
  return atob(str.replace(/-/g, '+').replace(/_/g, '/'))
}

/**
 * Constructs a complete rev-share payment pointer from an array of shares.
 * @param {Share[]} shares - The array of Share objects.
 * @returns {string | undefined} The generated rev-share payment pointer, or undefined if no valid shares are provided.
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
 * Parses a rev-share payment pointer string to extract the shares.
 * @param {string} pointer - The rev-share payment pointer.
 * @returns {SharesState} An array of Share objects.
 * @throws {Error} If the pointer is malformed, missing share data, or contains invalid JSON.
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
 * Parses an HTML monetization tag (`<meta>` or `<link>`) to extract the shares.
 * @param {string} tag - The HTML tag as a string.
 * @returns {SharesState | undefined} An array of Share objects, or undefined if no shares are found.
 * @throws {Error} If the tag is malformed or does not contain a valid monetization pointer.
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
 * Checks if a string is a rev-share payment pointer.
 * @private
 * @param {string} str - The string to check.
 * @returns {boolean} True if the string is a rev-share pointer.
 */
function isRevsharePointer(str: string): boolean {
  return (
    str.startsWith(BASE_REVSHARE_POINTER) ||
    str.startsWith(normalizePointerPrefix(BASE_REVSHARE_POINTER))
  )
}

/**
 * Intelligently parses a string that could be either a raw payment pointer or a full HTML tag.
 * @param {string} tag - The string input, which can be a payment pointer or an HTML tag.
 * @returns {SharesState | undefined} An array of Share objects.
 * @throws {Error} If the input string is empty or invalid.
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
 * Trims a number to a fixed number of decimal places (3).
 * @param {number} dec - The number to trim.
 * @returns {number} The trimmed number.
 */
export function trimDecimal(dec: number): number {
  return Number(dec.toFixed(3))
}

/**
 * Validates the structure of a pointer list. Acts as a type guard.
 * @param {unknown} pointerList - The data to validate.
 * @returns {pointerList is [string, number, string?][]} True if the data is a valid pointer list.
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
 * Normalizes a payment pointer prefix, converting `$` to `https://`.
 * @param {string} pointer - The payment pointer string.
 * @returns {string} The normalized payment pointer with the https scheme.
 */
export function normalizePointerPrefix(pointer: string): string {
  return pointer.startsWith('$') ? 'https://' + pointer.substring(1) : pointer
}

/**
 * Validates if a given string is a valid payment pointer.
 * Allows undefined or empty strings to pass, as they may be valid in an intermediate state.
 * @param {string | undefined} pointer - The payment pointer to validate.
 * @returns {boolean} True if the pointer is valid or empty/undefined.
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
 * Validates if a given weight is a valid, non-negative number.
 * Allows undefined or empty strings to pass, as they may be valid in an intermediate state.
 * @param {string | number | undefined} weight - The weight to validate.
 * @returns {boolean} True if the weight is valid or empty/undefined.
 */
export function validateWeight(weight: string | number | undefined): boolean {
  if (weight === undefined || weight === '') {
    return true
  }

  const num = Number(weight)
  return !Number.isNaN(num) && num >= 0
}

/**
 * Validates an entire array of Share objects, checking each share's pointer and weight.
 * @param {SharesState} shares - The array of shares to validate.
 * @returns {boolean} True if all shares in the array are valid.
 */
export function validateShares(shares: SharesState): boolean {
  if (!Array.isArray(shares) || shares.length === 0) {
    return false
  }

  for (const share of shares) {
    if (!validatePointer(share.pointer)) {
      return false
    }

    if (!validateWeight(share.weight)) {
      return false
    }
  }

  return true
}
