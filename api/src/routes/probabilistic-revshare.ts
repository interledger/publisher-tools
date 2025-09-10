import type { WalletAddress } from '@interledger/open-payments'
import { decode, pickWeightedRandom } from '@shared/probabilistic-revenue-share'
import { isWalletAddress, validateWalletAddressOrPointer } from '@shared/utils'
import { z } from 'zod'
import { createHTTPException } from '../utils/utils'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export const paramSchema = z.object({
  payload: z.string().base64url().max(50_000).min(20)
})

export async function handler(encodedPayload: string): Promise<WalletAddress> {
  let pointerMap
  try {
    pointerMap = decode(encodedPayload)
  } catch (error) {
    throw createHTTPException(400, 'Invalid payload', error)
  }

  const selected = pickWeightedRandom(pointerMap)
  let walletAddressUrl
  try {
    walletAddressUrl = validateWalletAddressOrPointer(selected)
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
  if (!isWalletAddress(json)) {
    const message = 'did not resolve to a valid wallet address'
    throw createHTTPException(400, message, { message })
  }

  return json
}
