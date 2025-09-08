import type { WalletAddress } from '@interledger/open-payments'
import { decode, type Payload } from '@shared/probabilistic-revenue-share'
import { isWalletAddress, validateWalletAddressOrPointer } from '@shared/utils'
import { z } from 'zod'
import { createHTTPException } from '../utils/utils'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

type Result = WalletAddress | { options: Payload }

export const paramsSchema = z.object({
  payload: z.string().base64url().max(50_000).min(20)
})

export async function handler(
  payload: string,
  format: 'import' | 'address'
): Promise<Result> {
  let pointerMap
  try {
    pointerMap = decode(payload)
  } catch (error) {
    throw createHTTPException(400, 'Invalid payload', error)
  }

  if (format === 'import') {
    return { options: pointerMap }
  }

  const pointer = pickPointer(pointerMap)

  let walletAddressUrl
  try {
    walletAddressUrl = validateWalletAddressOrPointer(pointer)
  } catch (error) {
    throw createHTTPException(400, 'Invalid wallet address', error)
  }

  const res = await fetch(walletAddressUrl, {
    headers: { 'Content-type': 'application/json' }
  })
  if (!res.ok) {
    const msg = 'did not resolve to a valid wallet address'
    const message = res.statusText
    // @ts-expect-error We only expect a ContentfulStatusCode
    const status: ContentfulStatusCode = res.status >= 400 ? res.status : 400
    throw createHTTPException(status, msg, { message })
  }

  const json = await res.json().catch(() => null)
  if (!json || !isWalletAddress(json as Record<string, unknown>)) {
    const message = 'did not resolve to a valid wallet address'
    throw createHTTPException(400, message, { message })
  }

  return json
}

function pickPointer(entries: Payload) {
  const sum = entries.reduce((sum2, entry) => sum2 + entry.weight, 0)
  let choice = Math.random() * sum
  for (const entry of entries) {
    const weight = entry.weight
    if ((choice -= weight) <= 0) {
      return entry.pointer
    }
  }
  throw new Error('unable to choose pointer; drew invalid value')
}
