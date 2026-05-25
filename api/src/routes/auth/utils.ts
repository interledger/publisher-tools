import { sign, verify } from 'hono/jwt'
import type { JWTPayload } from 'hono/utils/jwt/types'
import type { KVNamespace } from '@cloudflare/workers-types'
import type { GrantContinuation } from '@interledger/open-payments'
import type { WalletAddressInfo } from '../../types'

const MAX_AGE_SECONDS = 7 * 24 * 60 * 60

interface TokenData {
  /** Wallet Address ID */
  sub: string
  /** Wallet addres URL, if different from ID */
  waUrl?: string
  /** Original issued at time. Stays same even after refreshes */
  auth_time: number
}

interface TokenPayload extends TokenData, JWTPayload {
  exp: Required<JWTPayload['exp']>
  iat: Required<JWTPayload['iat']>
}

/**
 * Token to verify user owns given wallet address.
 */
export async function createToken(
  walletAddress: Pick<WalletAddressInfo, 'id' | '$url'>,
  secret: string,
) {
  const payload: TokenData = {
    sub: walletAddress.id,
    ...(walletAddress.id !== walletAddress.$url && {
      waUrl: walletAddress.$url,
    }),
    auth_time: Math.floor(Date.now() / 1000),
  }
  return await _createToken(payload, secret)
}

export async function verifyToken(token: string, secret: string) {
  try {
    // Hono's verify() will throw an error if the signature is invalid
    // OR if the current time is past the 'exp' claim.
    const payload = await verify(token, secret, 'HS256')
    return payload as TokenPayload
  } catch {
    // Catching JwtTokenExpired, JwtTokenInvalid, or JwtTokenSignatureMismatched
    return null
  }
}

export async function refreshToken(token: string, secret: string) {
  const payload = await verifyToken(token, secret)
  if (!payload) return null
  const { sub, waUrl, auth_time } = payload
  return await _createToken({ sub, waUrl, auth_time }, secret)
}

async function _createToken(data: TokenData, secret: string) {
  const nowInSeconds = Math.floor(Date.now() / 1000)
  const payload: TokenPayload = {
    ...data,
    iat: nowInSeconds,
    exp: nowInSeconds + MAX_AGE_SECONDS,
  }
  return await sign(payload, secret, 'HS256')
}

const getKey = (id: string) => `auth/req-${id}`

export type TmpGrantData = {
  grantContinuation: GrantContinuation['continue']
  walletAddress: WalletAddressInfo
  nonce: string
}

export async function saveGrant(
  kv: KVNamespace,
  requestId: string,
  data: TmpGrantData,
) {
  await kv.put(getKey(requestId), JSON.stringify(data), {
    expirationTtl: 10 * 60, // 10min
  })
}

export async function getGrant(kv: KVNamespace, requestId: string) {
  const data = await kv.get<TmpGrantData>(getKey(requestId), 'json')
  return data
}
