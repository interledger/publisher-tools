import {
  type PendingGrant,
  type WalletAddress,
  type AuthenticatedClient,
  isFinalizedGrant,
  isPendingGrant,
  createAuthenticatedClient
} from '@interledger/open-payments'
import { createId } from '@paralleldrive/cuid2'
import { getWalletAddress } from '@shared/utils'
import { createContentDigestHeader } from 'httpbis-digest-headers'
import { signMessage } from 'http-message-signatures/lib/httpbis'
import type { Request } from 'http-message-signatures'
import * as ed from '@noble/ed25519'

interface RequestLike extends Request {
  body?: string
}

interface SignOptions {
  request: RequestLike
  privateKey: Uint8Array
  keyId: string
}

export interface SignatureHeaders {
  'Signature': string
  'Signature-Input': string
}

interface ContentHeaders {
  'Content-Digest': string
  'Content-Length': string
  'Content-Type': string
}
type Headers = SignatureHeaders & Partial<ContentHeaders>

let client: AuthenticatedClient
/**
 * Creates an authenticated Open Payments client for making signed requests.
 * Based on the Interledger Web Monetization Extension implementation:
 * @see https://github.com/interledger/web-monetization-extension/blob/main/src/background/services/openPayments.ts#L163
 */
async function createClient(env: Env) {
  client ??= await createAuthenticatedClient({
    validateResponses: false,
    requestTimeoutMs: 10000,
    walletAddressUrl: env.OP_WALLET_ADDRESS,
    authenticatedRequestInterceptor: async (request) => {
      if (!request.method || !request.url) {
        throw new Error('Cannot intercept request: url or method missing')
      }

      const initialRequest = request.clone()

      const headers = await createHeaders({
        request: {
          method: request.method,
          url: request.url,
          headers: Object.fromEntries(request.headers.entries()),
          body: request.body ? JSON.stringify(await request.json()) : undefined
        },
        privateKey: Buffer.from(env.OP_PRIVATE_KEY, 'base64'),
        keyId: env.OP_KEY_ID
      })

      if (request.body) {
        initialRequest.headers.set(
          'Content-Type',
          headers['Content-Type'] as string
        )
        initialRequest.headers.set(
          'Content-Digest',
          headers['Content-Digest'] as string
        )
      }

      initialRequest.headers.set('Signature', headers['Signature'] as string)
      initialRequest.headers.set('Signature-Input', headers['Signature-Input'])

      return initialRequest as typeof request
    }
  })

  return client
}

export async function getValidWalletAddress(env: Env, walletAddress: string) {
  const response = await getWalletAddress(walletAddress)
  return response
}

export async function createInteractiveGrant(
  env: Env,
  args: {
    walletAddress: WalletAddress
    redirectUrl?: string
  }
) {
  const opClient = await createClient(env)
  const clientNonce = crypto.randomUUID()
  const paymentId = createId()

  const outgoingPaymentGrant = await createOutgoingPaymentGrant({
    walletAddress: args.walletAddress,
    debitAmount: {
      value: String(1 * 10 ** args.walletAddress.assetScale),
      assetCode: args.walletAddress.assetCode,
      assetScale: args.walletAddress.assetScale
    },
    nonce: clientNonce,
    paymentId: paymentId,
    opClient,
    redirectUrl: args.redirectUrl
  })

  return outgoingPaymentGrant
}

export interface Amount {
  value: string
  assetCode: string
  assetScale: number
}

type CreateOutgoingPaymentParams = {
  walletAddress: WalletAddress
  debitAmount: Amount
  nonce?: string
  paymentId: string
  opClient: AuthenticatedClient
}

async function createOutgoingPaymentGrant(
  params: CreateOutgoingPaymentParams & { redirectUrl?: string }
): Promise<PendingGrant> {
  const {
    walletAddress,
    debitAmount,
    nonce,
    paymentId,
    opClient,
    redirectUrl
  } = params

  const grant = await opClient.grant
    .request(
      {
        url: walletAddress.authServer
      },
      {
        access_token: {
          access: [
            {
              identifier: walletAddress.id,
              type: 'outgoing-payment',
              actions: ['create', 'read'],
              limits: {
                debitAmount: debitAmount
              }
            }
          ]
        },
        interact: {
          start: ['redirect'],
          finish: {
            method: 'redirect',
            uri: `${redirectUrl}?paymentId=${paymentId}`,
            nonce: nonce || ''
          }
        }
      }
    )
    .catch((error) => {
      throw new Error('Could not retrieve outgoing payment grant.', {
        cause: error
      })
    })

  if (!isPendingGrant(grant)) {
    throw new Error('Expected interactive outgoing payment grant.')
  }

  return grant
}

export async function isGrantValidAndAccepted(
  env: Env,
  payment: PendingGrant,
  interactRef: string
): Promise<boolean> {
  const opClient = await createClient(env)

  const continuation = await opClient.grant.continue(
    {
      accessToken: payment.continue.access_token.value,
      url: payment.continue.uri
    },
    {
      interact_ref: interactRef
    }
  )

  if (!isFinalizedGrant(continuation)) {
    return false
  }

  // when continuation has access_token value it has been accepted by user
  return continuation?.access_token?.value ? true : false
}

async function createHeaders({
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
