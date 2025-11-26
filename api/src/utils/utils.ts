import { HTTPException } from 'hono/http-exception'
import { signMessage } from 'http-message-signatures/lib/httpbis'
import { createContentDigestHeader } from 'httpbis-digest-headers'
import { signAsync } from '@noble/ed25519'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { Request } from 'http-message-signatures'

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

export function sleep(delay: number): Promise<void> {
  return new Promise((r) => setTimeout(r, delay))
}

export function waitWithAbort(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('TimeoutError'))
      return
    }

    const timer = setTimeout(resolve, ms)

    const onAbort = () => {
      clearTimeout(timer)
      reject(new Error('TimeoutError'))
    }

    signal.addEventListener('abort', onAbort, { once: true })
  })
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
      return Buffer.from(await signAsync(data, key))
    }
  }
}

export function serializeError(error: unknown) {
  return JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)))
}

export function createHTTPException(
  statusCode: ContentfulStatusCode,
  message: string,
  error: unknown
) {
  const serializedError = serializeError(error)
  return new HTTPException(statusCode, {
    message,
    cause: serializedError
  })
}

export function urlWithParams(
  url: string | URL,
  params: Record<string, string>
): URL {
  const result = new URL(url)
  const searchParams = new URLSearchParams(params)
  for (const [key, val] of searchParams.entries()) {
    result.searchParams.set(key, val)
  }
  return result
}
