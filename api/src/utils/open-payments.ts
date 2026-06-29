import {
  createAuthenticatedClient,
  isFinalizedGrantWithAccessToken,
  isPendingGrant,
  OpenPaymentsClientError,
  type PendingGrant,
  type WalletAddress,
  type AuthenticatedClient,
  type IncomingPayment,
  type OutgoingPayment,
  type Grant,
  type GrantContinuation,
} from '@interledger/open-payments'
import type { Amount } from '@shared/types'
import { toAmount, sleep } from '@shared/utils'
import { createHeaders } from './utils.js'
import type { Env } from '../app.js'
import type { PaymentInitiateInput } from '../routes/payment/initiate.js'
import type { PaymentQuoteInput } from '../routes/payment/quotes.js'

const OUTGOING_PAYMENT_POLLING_INITIAL_DELAY = 3000
const OUTGOING_PAYMENT_POLLING_INTERVAL = 1500
const OUTGOING_PAYMENT_POLLING_MAX_ATTEMPTS = 3

export class OpenPaymentsService {
  private client!: AuthenticatedClient
  private static _instance: OpenPaymentsService

  public static async getInstance(env: Env): Promise<OpenPaymentsService> {
    if (!OpenPaymentsService._instance) {
      OpenPaymentsService._instance = new OpenPaymentsService()
      OpenPaymentsService._instance.client =
        await OpenPaymentsService._instance.initClient(env)
    }
    return OpenPaymentsService._instance
  }

  public static async getClient(env: Env) {
    const instance = await OpenPaymentsService.getInstance(env)
    return instance.client
  }

  private async initClient(env: Env): Promise<AuthenticatedClient> {
    const { OP_WALLET_ADDRESS, OP_PRIVATE_KEY, OP_KEY_ID } = env
    return await createAuthenticatedClient({
      validateResponses: false,
      requestTimeoutMs: 10000,
      walletAddressUrl: OP_WALLET_ADDRESS,
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
            body: request.body
              ? JSON.stringify(await request.json())
              : undefined,
          },
          privateKey: Buffer.from(OP_PRIVATE_KEY, 'base64'),
          keyId: OP_KEY_ID,
        })

        if (request.body) {
          initialRequest.headers.set(
            'Content-Type',
            headers['Content-Type'] as string,
          )
          initialRequest.headers.set(
            'Content-Digest',
            headers['Content-Digest'] as string,
          )
        }

        initialRequest.headers.set('Signature', headers['Signature'] as string)
        initialRequest.headers.set(
          'Signature-Input',
          headers['Signature-Input'],
        )

        return initialRequest as typeof request
      },
    })
  }

  async paymentQuote({ sender, receiver, ...amt }: PaymentQuoteInput) {
    const debitAmount = amt.debitAmount
      ? toAmount(amt.debitAmount, sender)
      : undefined
    const receiveAmount = amt.receiveAmount
      ? toAmount(amt.receiveAmount, receiver)
      : undefined

    const [quoteGrant, incomingPaymentGrant] = await Promise.all([
      this.createQuoteGrant(sender),
      this.createIncomingPaymentGrant(receiver),
    ])

    const incomingPayment = await this.createIncomingPayment({
      accessToken: incomingPaymentGrant.access_token.value,
      walletAddress: receiver,
      expiresIn: 15 * 1000,
      note: 'Quote via Publisher Tools',
    })

    const quote = await this.client.quote.create(
      {
        url: sender.resourceServer,
        accessToken: quoteGrant.access_token.value,
      },
      {
        method: 'ilp',
        walletAddress: sender.id,
        receiver: incomingPayment.id,
        ...(debitAmount ? { debitAmount } : { receiveAmount }),
      },
    )

    void this.revokeIncomingPaymentGrant(incomingPaymentGrant).catch(() => {})

    return {
      debitAmount: quote.debitAmount,
      receiveAmount: quote.receiveAmount,
      id: quote.id,
    }
  }

  async paymentInitiate(params: PaymentInitiateInput) {
    const { sender, receiver, note, redirectUrl, ...amt } = params
    const debitAmount = amt.debitAmount
      ? toAmount(amt.debitAmount, sender)
      : undefined
    const receiveAmount = amt.receiveAmount
      ? toAmount(amt.receiveAmount, receiver)
      : undefined

    const [quoteGrant, incomingPaymentGrant] = await Promise.all([
      this.createQuoteGrant(sender),
      this.createIncomingPaymentGrant(receiver),
    ])
    const incomingPayment = await this.createIncomingPayment({
      accessToken: incomingPaymentGrant.access_token.value,
      walletAddress: receiver,
      note,
    })
    // We already got the incoming payment, we don't need the grant anymore.
    void this.revokeIncomingPaymentGrant(incomingPaymentGrant).catch(() => {})

    const quote = await this.client.quote.create(
      {
        url: sender.resourceServer,
        accessToken: quoteGrant.access_token.value,
      },
      {
        method: 'ilp',
        walletAddress: sender.id,
        receiver: incomingPayment.id,
        ...(debitAmount ? { debitAmount } : { receiveAmount }),
      },
    )

    const nonce = crypto.randomUUID()
    const grant = await this.createOutgoingPaymentGrant({
      sender,
      incomingPaymentId: incomingPayment.id,
      debitAmount: quote.debitAmount,
      redirectUrl,
      nonce,
    })

    return {
      quoteId: quote.id,
      incomingPaymentId: incomingPayment.id,
      grantRedirectUrl: grant.interact.redirect,
      grantContinuation: grant.continue,
      nonce,
      amount: debitAmount || receiveAmount!,
    }
  }

  async paymentComplete(params: {
    sender: WalletAddress
    quoteId: string
    grantContinuation: GrantContinuation['continue']
    nonce: string
    interactRef: string
    hash: string
    metadata: Record<string, unknown>
  }) {
    const { grantContinuation, interactRef, quoteId, sender, metadata } = params

    const grant = await this.client.grant.continue(
      {
        url: grantContinuation.uri,
        accessToken: grantContinuation.access_token.value,
      },
      { interact_ref: interactRef },
    )
    if (!isFinalizedGrantWithAccessToken(grant)) {
      throw new Error('Expected finalized grant with access token')
    }

    const outgoingPayment = await this.client.outgoingPayment.create(
      {
        url: sender.resourceServer,
        accessToken: grant.access_token.value,
      },
      { walletAddress: sender.id, quoteId, metadata },
    )

    return {
      outgoingPaymentId: outgoingPayment.id,
      accessToken: grant.access_token.value,
    }
  }

  private async createIncomingPaymentGrant({
    authServer,
  }: Pick<WalletAddress, 'authServer'>) {
    const grant = await this.client.grant.request(
      { url: authServer },
      {
        access_token: {
          access: [
            {
              type: 'incoming-payment',
              actions: ['read', 'create', 'complete'],
            },
          ],
        },
      },
    )

    if (isPendingGrant(grant)) {
      throw new Error('Expected non-interactive grant')
    }
    if (!isFinalizedGrantWithAccessToken(grant)) {
      throw new Error('Expected incoming payment grant with access token')
    }

    return grant
  }

  private async revokeIncomingPaymentGrant(incomingPaymentGrant: Grant) {
    await this.client.grant.cancel({
      url: incomingPaymentGrant.continue.uri,
      accessToken: incomingPaymentGrant.continue.access_token.value,
    })
  }

  private async createIncomingPayment({
    accessToken,
    walletAddress,
    note,
    expiresIn = 6 * 60 * 1000,
  }: CreateIncomingPaymentParams) {
    return await this.client.incomingPayment.create(
      {
        url: walletAddress.resourceServer,
        accessToken: accessToken,
      },
      {
        expiresAt: new Date(Date.now() + expiresIn).toISOString(),
        walletAddress: walletAddress.id,
        metadata: {
          description: note,
        },
      },
    )
  }

  private async createQuoteGrant({ authServer }: WalletAddress) {
    return await this.client.grant
      .request(
        { url: authServer },
        {
          access_token: {
            access: [{ type: 'quote', actions: ['create', 'read'] }],
          },
        },
      )
      .then((grant) => {
        if (isPendingGrant(grant)) {
          throw new Error('Expected non-interactive grant')
        }
        if (!isFinalizedGrantWithAccessToken(grant)) {
          throw new Error('Expected quote grant with access token')
        }
        return grant
      })
      .catch((err) => {
        throw new Error('Could not create quote grant.', { cause: err })
      })
  }

  private async createOutgoingPaymentGrant({
    sender,
    incomingPaymentId,
    debitAmount,
    redirectUrl,
    nonce,
  }: {
    sender: WalletAddress
    incomingPaymentId: string
    debitAmount: Amount
    redirectUrl: string
    nonce: string
  }): Promise<PendingGrant> {
    const grant = await this.client.grant.request(
      { url: sender.authServer },
      {
        access_token: {
          access: [
            {
              identifier: sender.id,
              type: 'outgoing-payment',
              actions: ['create', 'read'],
              limits: { receiver: incomingPaymentId, debitAmount },
            },
          ],
        },
        interact: {
          start: ['redirect'],
          finish: { method: 'redirect', uri: redirectUrl, nonce },
        },
      },
    )

    if (!isPendingGrant(grant)) {
      throw new Error('Expected interactive outgoing payment grant.')
    }

    return grant
  }

  async pollOutgoingPayment(
    outgoingPaymentId: OutgoingPayment['id'],
    continuationAccessToken: string,
  ): Promise<OutgoingPaymentStatus> {
    let attempts = 0
    await sleep(OUTGOING_PAYMENT_POLLING_INITIAL_DELAY)
    while (++attempts <= OUTGOING_PAYMENT_POLLING_MAX_ATTEMPTS) {
      const outgoingPayment = await this.client.outgoingPayment.get({
        url: outgoingPaymentId,
        accessToken: continuationAccessToken,
      })

      if (hasCancellationReason(outgoingPayment)) {
        return {
          success: false,
          error: {
            code: 'CANCELLATION_REASON',
            message: `Payment aborted due to: ${outgoingPayment.metadata?.cancellationReason}`,
          },
        }
      }

      if (
        outgoingPayment.debitAmount.value === outgoingPayment.sentAmount.value
      ) {
        break
      }

      if (attempts === OUTGOING_PAYMENT_POLLING_MAX_ATTEMPTS) {
        return {
          success: false,
          error: {
            code: 'OUTGOING_PAYMENT_INCOMPLETE',
            message: 'The payment did not complete within the expected time.',
          },
        }
      }
      await sleep(OUTGOING_PAYMENT_POLLING_INTERVAL)
    }

    return { success: true }
  }

  async getIncomingPayment(incomingPaymentId: IncomingPayment['id']) {
    const url = incomingPaymentId
    const incomingPayment = await this.client.incomingPayment.getPublic({ url })

    const grant = await this.client.grant.request(
      { url: incomingPayment.authServer },
      {
        access_token: {
          access: [{ type: 'incoming-payment', actions: ['read'] }],
        },
      },
    )
    if (isFinalizedGrantWithAccessToken(grant)) {
      const accessToken = grant.access_token?.value
      return this.client.incomingPayment.get({ url, accessToken })
    }

    return incomingPayment
  }
}

const isOpenPaymentsClientError = (error: unknown) =>
  error instanceof OpenPaymentsClientError

// happens during quoting only
export const isNonPositiveAmountError = (
  error: unknown,
): error is OpenPaymentsClientError & {
  details?: { minSendAmount?: Amount }
} => {
  if (!isOpenPaymentsClientError(error)) return false
  return (
    error.status === 400 &&
    error.description?.toLowerCase()?.includes('non-positive receive amount')
  )
}

function hasCancellationReason(outgoingPayment: OutgoingPayment): boolean {
  return (
    outgoingPayment.failed &&
    typeof outgoingPayment.metadata === 'object' &&
    'cancellationReason' in outgoingPayment.metadata
  )
}

type CreateIncomingPaymentParams = {
  accessToken: string
  walletAddress: WalletAddress
  note?: string
  expiresIn?: number
}

export type OutgoingPaymentStatus =
  | { success: true }
  | {
      success: false
      error: { code: string; message: string; details?: Error }
    }
