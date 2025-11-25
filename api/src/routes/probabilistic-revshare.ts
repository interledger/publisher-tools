import { zValidator } from '@hono/zod-validator'
import type { WalletAddress } from '@interledger/open-payments'
import { decode, pickWeightedRandom } from '@shared/probabilistic-revenue-share'
import { isWalletAddress, validateWalletAddressOrPointer } from '@shared/utils'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import z from 'zod'
import { app } from '../app.js'
import { createHTTPException } from '../utils/utils'


app.get(
  '/revshare/:payload',
  zValidator(
    'param',
    z.object({
      payload: z.base64url().max(50_000).min(20)
    })
  ),
  async ({ req, json }) => {
    const encodedPayload = req.param('payload')
    try {
      const result = await handler(encodedPayload)
      return json(result)
    } catch (error) {
      if (error instanceof HTTPException) throw error
      throw createHTTPException(500, 'Revenue share error', error)
    }
  }
)

async function handler(encodedPayload: string): Promise<WalletAddress> {
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
