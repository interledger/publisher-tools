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

// Represents a single revenue share participant
export type Share = {
  // An optional name for the recipient for display purposes
  name?: string
  // The payment pointer or wallet address of the recipient
  pointer: string
  // The numerical weight of the share, used to calculate the distribution
  weight?: number
  // The percentage of revenue this share should receive, if applicable
  percent?: number
}

// Represents the state of all shares in the revenue distribution
export type SharesState = Share[]

// Returns an array of valid shares, filtering out any shares that do not have a pointer or weight
export function getValidShares(shares: Share[]): SharesState {
  return shares.filter((share) => share.pointer && Number(share.weight))
}

// Converts an array of Share objects into chart data suitable for rendering in a pie chart
export function sharesToChartData(
  shares: Share[]
): { title: string; value: number; color: string }[] {
  return getValidShares(shares).map((share, i) => ({
    title: share.name || share.pointer,
    value: Number(share.weight),
    color: CHART_COLORS[i % CHART_COLORS.length]
  }))
}

// Converts an array of Share objects into a list of payment pointers, weights, and names
export function sharesToPointerList(
  shares: SharesState
): [string, number, string][] {
  return shares.flatMap((share) =>
    share.pointer && share.weight
      ? [[share.pointer, Number(share.weight), share.name || '']]
      : []
  )
}

// Converts a simplified pointer list back into an array of Share objects
export function sharesFromPointerList(
  pointerList: [string, number, string][]
): SharesState {
  return pointerList.map(([pointer, weight, name]) => ({
    pointer,
    weight,
    name
  }))
}

// Immutably updates a share at a specific index in the shares array
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

// Immutably removes a share from a specific index in the shares array
export function dropIndex(arr: SharesState, i: number): SharesState {
  return [...arr.slice(0, i), ...arr.slice(i + 1)]
}

// Calculates the required weight for a share to achieve a target percentage of the total
export function weightFromPercent(
  // The target percentage (0 to 1)
  percent: number,
  // The current weight of the share
  weight: number,
  // The total weight of all shares
  totalWeight: number
): number {
  return (-percent * (totalWeight - weight)) / (percent - 1)
}

// Encodes a string into a URL-safe base64 format
export function base64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// Decodes a URL-safe base64 string back to its original format.
export function fromBase64url(str: string): string {
  return atob(str.replace(/-/g, '+').replace(/_/g, '/'))
}

// Constructs a complete revshare payment pointer from an array of shares
export function sharesToPaymentPointer(shares: Share[]): string | undefined {
  const validShares = getValidShares(shares)

  if (!validShares.length) {
    return
  }

  const pointerList = sharesToPointerList(validShares)
  const encodedShares = base64url(JSON.stringify(pointerList))

  return normalizePointerPrefix(BASE_REVSHARE_POINTER) + encodedShares
}

// Parses a rev-share payment pointer string to extract the shares.
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

// Parses an HTML monetization tag (`<meta>` or `<link>`) to extract the shares
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

// Checks if a string is a revshare payment pointer.
function isRevsharePointer(str: string): boolean {
  return (
    str.startsWith(BASE_REVSHARE_POINTER) ||
    str.startsWith(normalizePointerPrefix(BASE_REVSHARE_POINTER))
  )
}

// Converts a tag or pointer string into an array of Share objects
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

// Trims a decimal number to 3 decimal places
export function trimDecimal(dec: number): number {
  return Number(dec.toFixed(3))
}

// Validates if a given pointer list is an array of [string, number, string?] tuples
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

// Normalizes a payment pointer prefix, converting `$` to `https://`
export function normalizePointerPrefix(pointer: string): string {
  return pointer.startsWith('$') ? 'https://' + pointer.substring(1) : pointer
}

// Validates if a given pointer is a valid URL or payment pointer
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

// Validates if a given weight is a valid number greater than or equal to 0
export function validateWeight(weight: string | number | undefined): boolean {
  if (weight === undefined || weight === '') {
    return true
  }

  const num = Number(weight)
  return !Number.isNaN(num) && num >= 0
}

// Validates if a given share is valid, checking both pointer and weight
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
