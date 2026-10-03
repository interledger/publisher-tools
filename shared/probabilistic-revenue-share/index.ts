export interface PayloadEntry {
  /** The payment pointer or wallet address of the recipient */
  pointer: string
  /** The percentage chance that this recipient will be selected */
  percentage: number
  /** An optional name for the recipient for display purposes */
  name?: string
}

/** Represents the state of all shares in the revenue distribution */
export type Payload = PayloadEntry[]

type PointerList = Array<[pointer: string, percentage: number, name: string]>

export function encode(payload: Payload) {
  const pointerList: PointerList = payload.flatMap((e) =>
    e.pointer && e.percentage
      ? [[e.pointer, Number(e.percentage), e.name || '']]
      : [],
  )
  return base64url(JSON.stringify(pointerList))
}

export function decode(pathPart: string): Payload {
  let stringifiedPointerList
  try {
    stringifiedPointerList = fromBase64url(pathPart)
  } catch {
    throw new Error('Invalid base64url payload')
  }

  let pointerList
  try {
    pointerList = JSON.parse(stringifiedPointerList)
  } catch {
    throw new Error('Invalid JSON payload')
  }

  if (!isPointerList(pointerList)) {
    throw new Error('Invalid payload')
  }

  return pointerList.map(([pointer, percentage, name]) => ({
    pointer,
    percentage,
    name,
  }))
}

export function pickRandomByPercentage(entries: Payload) {
  // Use the actual sum so links generated with legacy relative weights continue
  // to select recipients with the same probability.
  const sum = entries.reduce((sum2, entry) => sum2 + entry.percentage, 0)
  let choice = Math.random() * sum
  for (const entry of entries) {
    if ((choice -= entry.percentage) <= 0) {
      return entry.pointer
    }
  }
  throw new Error('unable to choose pointer; drew invalid value')
}

function isPointerList(pointerList: unknown): pointerList is PointerList {
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
 * Encodes a string into a URL-safe base64 format
 * @param str - The string to encode
 * @returns URL-safe base64 encoded string
 */
function base64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Decodes a URL-safe base64 string back to its original format
 * @param str - The URL-safe base64 string to decode
 * @returns Decoded original string
 */
function fromBase64url(str: string): string {
  return atob(str.replace(/-/g, '+').replace(/_/g, '/'))
}
