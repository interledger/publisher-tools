import { signMessage } from 'http-message-signatures/lib/httpbis'
import { createContentDigestHeader } from 'httpbis-digest-headers'
import type { Request } from 'http-message-signatures'
import * as ed from '@noble/ed25519'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { HTTPException } from 'hono/http-exception'

type Headers = SignatureHeaders & Partial<ContentHeaders>

interface SignatureHeaders {
  'Signature': string
  'Signature-Input': string
}

interface ContentHeaders {
  'Content-Digest': string
  'Content-Length': string
  'Content-Type': string
}

interface RequestLike extends Request {
  body?: string
}

interface SignOptions {
  request: RequestLike
  privateKey: Uint8Array
  keyId: string
}

export function walletAddressToKey(walletAddress: string): string {
  return `${decodeURIComponent(walletAddress).replace('$', '').replace('https://', '')}.json`
}

export function timeout(delay: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delay))
}

export function toWalletAddressUrl(s: string): string {
  return s.startsWith('$') ? s.replace('$', 'https://') : s
}

export function formatAmount({
  value,
  assetCode,
  assetScale
}: {
  value: string
  assetCode: string
  assetScale: number
}) {
  const amount = Number(value) / Math.pow(10, assetScale)
  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£'
  }

  const symbol =
    currencySymbols[assetCode.toUpperCase()] || assetCode.toUpperCase()

  return {
    amount: amount.toFixed(2),
    currency: assetCode,
    amountWithCurrency: `${symbol}${amount.toFixed(2)}`
  }
}

export async function createHeaders({
  request,
  privateKey,
  keyId
}: SignOptions): Promise<Headers> {
  if (request.body) {
    const contentHeaders = createContentHeaders(request.body)
    request.headers = { ...request.headers, ...contentHeaders }
  }

  const signatureHeaders = await createSignatureHeaders({
    request,
    privateKey,
    keyId
  })

  return {
    ...request.headers,
    ...signatureHeaders
  }
}

function createContentHeaders(body: string): ContentHeaders {
  return {
    'Content-Digest': createContentDigestHeader(
      JSON.stringify(JSON.parse(body)),
      ['sha-512']
    ),
    'Content-Length': new TextEncoder().encode(body).length.toString(),
    'Content-Type': 'application/json'
  }
}
async function createSignatureHeaders({
  request,
  privateKey,
  keyId
}: SignOptions): Promise<SignatureHeaders> {
  const components = ['@method', '@target-uri']
  if (request.headers.Authorization || request.headers.authorization) {
    components.push('authorization')
  }

  if (request.body) {
    components.push('content-digest', 'content-length', 'content-type')
  }

  const signingKey = createSigner(privateKey, keyId)
  const { headers } = await signMessage(
    {
      name: 'sig1',
      params: ['keyid', 'created'],
      fields: components,
      key: signingKey
    },
    {
      url: request.url,
      method: request.method,
      headers: request.headers
    }
  )

  return {
    'Signature': headers.Signature as string,
    'Signature-Input': headers['Signature-Input'] as string
  }
}

function createSigner(key: Uint8Array, keyId: string) {
  return {
    id: keyId,
    alg: 'ed25519',
    async sign(data: Uint8Array) {
      return Buffer.from(await ed.signAsync(data, key))
    }
  }
}

export function serializeError(error: unknown) {
  return JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)))
}

export function createHTTPException(
  statusCode: ContentfulStatusCode,
  message: string,
  errorCode: string,
  error: unknown
) {
  const serializedError = serializeError(error)
  console.error(message, serializedError)
  return new HTTPException(statusCode, {
    message: JSON.stringify({
      error: {
        code: errorCode,
        ...serializedError
      }
    })
  })
}
