import {
  OpenPaymentsClientError,
  type PendingGrant,
  type WalletAddress,
  type AuthenticatedClient,
  type OutgoingPayment,
  type Quote,
  type Grant,
  isFinalizedGrantWithAccessToken,
  isPendingGrant,
  createAuthenticatedClient,
} from '@interledger/open-payments'
import type { components as RSComponents } from '@interledger/open-payments/dist/openapi/generated/resource-server-types'
import { createId } from '@paralleldrive/cuid2'
import type { Amount } from '@shared/types'
import { getWalletAddress, toAmount, urlWithParams } from '@shared/utils'
import { createHeaders, sleep, createHTTPException } from './utils.js'
import type { Env } from '../app.js'
import type { PaymentInitiateInput } from '../routes/payment/initiate.js'
import type { PaymentQuoteInput } from '../routes/payment/quotes.js'

export type CreatePayment = { quote: Quote; incomingPaymentGrant: Grant }
type AmountType = RSComponents['schemas']['amount']

type CreateIncomingPaymentParams = {
  accessToken: string
  walletAddress: WalletAddress
  note?: string
}

export type CheckPaymentResult =
  | { success: true }
  | {
      success: false
      error: { code: string; message: string; details?: Error }
    }

type QuoteGrantParams = {
  authServer: string
}

type CreateOutgoingPaymentParams = {
  walletAddress: WalletAddress
  incomingPaymentId: string
  debitAmount: Amount
  receiveAmount?: Amount
  nonce?: string
  paymentId: string
}

const OUTGOING_PAYMENT_POLLING_INITIAL_DELAY = 3000
const OUTGOING_PAYMENT_POLLING_INTERVAL = 1500
const OUTGOING_PAYMENT_POLLING_MAX_ATTEMPTS = 3

function hasCancellationReason(outgoingPayment: OutgoingPayment): boolean {
  return (
    outgoingPayment.failed &&
    typeof outgoingPayment.metadata === 'object' &&
    'cancellationReason' in outgoingPayment.metadata
  )
}

export interface InitiatePaymentResult {
  /** for polling payment completion */
  paymentId: string
  /** for outgoing-payment request */
  quoteId: string
  /** for any events for customer use */
  incomingPaymentId: string
  /** authentication */
  grantRedirectUrl: PendingGrant['interact']['redirect']
  /** post-authentication */
  grantContinuation: PendingGrant['continue']
  nonce: string
}

export class OpenPaymentsService {
  private client: AuthenticatedClient | null = null
  private static _instance: OpenPaymentsService

  public static async getInstance(env: Env): Promise<OpenPaymentsService> {
    if (!OpenPaymentsService._instance) {
      OpenPaymentsService._instance = new OpenPaymentsService()
      OpenPaymentsService._instance.client =
        await OpenPaymentsService._instance.initClient(env)
    }
    return OpenPaymentsService._instance
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

  async paymentQuote({ sender, receiver, ...amt }: PaymentQuoteInput): Promise<{
    debitAmount: Amount
    receiveAmount: Amount
    id: string
  }> {
    const debitAmount = amt.debitAmount
      ? toAmount(amt.debitAmount, sender)
      : undefined
    const receiveAmount = amt.receiveAmount
      ? toAmount(amt.receiveAmount, receiver)
      : undefined

    const [quoteGrant, incomingPaymentGrant] = await Promise.all([
      this.createQuoteGrant(sender),
      this.createIncomingPaymentGrant(receiver.authServer),
    ])

    const incomingPayment = await this.createIncomingPayment({
      accessToken: incomingPaymentGrant.access_token.value,
      walletAddress: receiver,
    })

    const quote = await this.client!.quote.create(
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

    return {
      debitAmount: quote.debitAmount,
      receiveAmount: quote.receiveAmount,
      id: quote.id,
    }
    // TODO: cleanup/expire things once done. we only cared about amounts for displaying
  }

  async paymentInitiate(
    params: PaymentInitiateInput,
  ): Promise<Omit<InitiatePaymentResult, 'paymentId'>> {
    const { sender, receiver, note, redirectUrl, ...amt } = params
    const debitAmount = amt.debitAmount
      ? toAmount(amt.debitAmount, sender)
      : undefined
    const receiveAmount = amt.receiveAmount
      ? toAmount(amt.receiveAmount, receiver)
      : undefined

    const [quoteGrant, incomingPaymentGrant] = await Promise.all([
      this.createQuoteGrant(sender),
      this.createIncomingPaymentGrant(receiver.authServer),
    ])
    const incomingPayment = await this.createIncomingPayment({
      accessToken: incomingPaymentGrant.access_token.value,
      walletAddress: receiver,
      note,
    })
    // We already got the incoming payment, we don't need the grant anymore.
    void this.revokeIncomingPaymentGrant(incomingPaymentGrant).catch(() => {})

    const quote = await this.client!.quote.create(
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
    const grant = await this.createOutgoingPaymentGrant2({
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
    }
  }

  async paymentComplete(params: {
    sender: WalletAddress
    quoteId: InitiatePaymentResult['quoteId']
    grantContinuation: InitiatePaymentResult['grantContinuation']
    nonce: string
    interactRef: string
    hash: string
    metadata: Record<string, unknown>
  }) {
    const { grantContinuation, interactRef, quoteId, sender, metadata } = params

    const grant = await this.client!.grant.continue(
      {
        url: grantContinuation.uri,
        accessToken: grantContinuation.access_token.value,
      },
      { interact_ref: interactRef },
    )
    if (!isFinalizedGrantWithAccessToken(grant)) {
      throw new Error('Expected finalized grant with access token')
    }

    const outgoingPayment = await this.client!.outgoingPayment.create(
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

  async createPayment(args: {
    senderWalletAddress: string
    receiverWalletAddress: string
    amount: number
    note?: string
  }) {
    const receiverWallet = await getWalletAddress(args.receiverWalletAddress)
    const { quote, incomingPaymentGrant } = await this.fetchQuote(
      {
        walletAddress: args.senderWalletAddress,
        amount: args.amount,
        note: args.note,
      },
      receiverWallet,
    )

    if (!receiverWallet) {
      throw new Error('Invalid receiver wallet address')
    }

    return {
      incomingPaymentGrant,
      quote,
    }
  }

  private async fetchQuote(
    args: {
      walletAddress: string
      amount: number
      note?: string
    },
    receiverWallet: WalletAddress,
  ): Promise<CreatePayment> {
    const walletAddress = await getWalletAddress(args.walletAddress)

    const amountObj = {
      value: BigInt(
        (args.amount * 10 ** walletAddress.assetScale).toFixed(),
      ).toString(),
      assetCode: walletAddress.assetCode,
      assetScale: walletAddress.assetScale,
    }

    const incomingPaymentGrant = await this.createIncomingPaymentGrant(
      receiverWallet.authServer,
    )

    // create incoming payment without incoming amount
    const incomingPayment = await this.createIncomingPayment({
      accessToken: incomingPaymentGrant.access_token.value,
      walletAddress: receiverWallet,
      note: args.note,
    })

    const quoteGrant = await this.createQuoteGrant({
      authServer: walletAddress.authServer,
    })

    if (isPendingGrant(quoteGrant)) {
      throw new Error('Expected non-interactive grant')
    }

    if (!isFinalizedGrantWithAccessToken(quoteGrant)) {
      throw new Error('Expected quote grant with access token')
    }

    const quote = await this.createPaymentQuote({
      walletAddress: walletAddress,
      accessToken: quoteGrant.access_token.value,
      amount: amountObj,
      receiver: incomingPayment.id,
    })

    return {
      quote,
      incomingPaymentGrant,
    }
  }

  async initializePayment(args: {
    walletAddress: WalletAddress
    incomingPaymentId: string
    debitAmount: Amount
    receiveAmount: Amount
    redirectUrl: string
  }): Promise<{ grant: PendingGrant; paymentId: string }> {
    const clientNonce = crypto.randomUUID()
    const paymentId = createId()

    const outgoingPaymentGrant = await this.createOutgoingPaymentGrant({
      walletAddress: args.walletAddress,
      incomingPaymentId: args.incomingPaymentId,
      debitAmount: args.debitAmount,
      receiveAmount: args.receiveAmount,
      nonce: clientNonce,
      paymentId: paymentId,
      redirectUrl: args.redirectUrl,
    })

    return { grant: outgoingPaymentGrant, paymentId }
  }

  async finishPaymentProcess(
    walletAddress: WalletAddress,
    pendingGrant: PendingGrant,
    quote: Quote,
    incomingPaymentGrant: Grant,
    interactRef: string,
    note: string,
  ): Promise<CheckPaymentResult> {
    const continuation = await this.client!.grant.continue(
      {
        url: pendingGrant.continue.uri,
        accessToken: pendingGrant.continue.access_token.value,
      },
      {
        interact_ref: interactRef,
      },
    )

    if (!isFinalizedGrantWithAccessToken(continuation)) {
      throw new Error('Expected finalized grant with access token')
    }

    const outgoingPayment = await this.client!.outgoingPayment.create(
      {
        url: walletAddress.resourceServer,
        accessToken: continuation.access_token.value,
      },
      {
        walletAddress: walletAddress.id,
        quoteId: quote.id,
        metadata: {
          description: note,
        },
      },
    ).catch(() => {
      throw new Error('Could not create outgoing payment.')
    })

    return await this.completePaymentProcess(
      quote.receiver,
      incomingPaymentGrant,
      outgoingPayment.id,
      continuation.access_token.value,
    )
  }

  private async createIncomingPaymentGrant(urlAuthServer: string) {
    const grant = await this.client!.grant.request(
      { url: urlAuthServer },
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

  private async createPaymentQuote(args: {
    walletAddress: WalletAddress
    accessToken: string
    amount: Amount
    receiver: string
  }) {
    try {
      // create quote with debit amount, you don't care how much money receiver gets
      return await this.client!.quote.create(
        {
          url: args.walletAddress.resourceServer,
          accessToken: args.accessToken,
        },
        {
          method: 'ilp',
          walletAddress: args.walletAddress.id,
          receiver: args.receiver,
          debitAmount: args.amount,
        },
      )
    } catch (error) {
      if (isOpenPaymentsClientError(error)) throw error
      throw createHTTPException(
        500,
        `Could not create payment quote for receiver ${args.walletAddress.id}.`,
        error,
      )
    }
  }

  private async revokeIncomingPaymentGrant(incomingPaymentGrant: Grant) {
    await this.client!.grant.cancel({
      url: incomingPaymentGrant.continue.uri,
      accessToken: incomingPaymentGrant.continue.access_token.value,
    })
  }

  private async createIncomingPayment({
    accessToken,
    walletAddress,
    note,
  }: CreateIncomingPaymentParams) {
    try {
      // create incoming payment without amount
      return await this.client!.incomingPayment.create(
        {
          url: walletAddress.resourceServer,
          accessToken: accessToken,
        },
        {
          expiresAt: new Date(Date.now() + 6 * 60 * 1000).toISOString(),
          walletAddress: walletAddress.id,
          metadata: {
            description: note,
          },
        },
      )
    } catch (error) {
      throw createHTTPException(
        500,
        'Unable to create incoming payment.',
        error,
      )
    }
  }

  private async createQuoteGrant({ authServer }: QuoteGrantParams) {
    return await this.client!.grant.request(
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

  private async createOutgoingPaymentGrant(
    params: CreateOutgoingPaymentParams & { redirectUrl: string },
  ): Promise<PendingGrant> {
    const {
      walletAddress,
      incomingPaymentId,
      debitAmount,
      nonce,
      paymentId,
      redirectUrl,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      receiveAmount,
    } = params

    try {
      const finishInteractUrl = urlWithParams(redirectUrl, { paymentId }).href
      const grant = await this.client!.grant.request(
        {
          url: walletAddress.authServer,
        },
        {
          access_token: {
            access: [
              {
                identifier: walletAddress.id,
                type: 'outgoing-payment',
                actions: ['create', 'read'],
                limits: {
                  receiver: incomingPaymentId,
                  debitAmount: debitAmount,
                },
              },
            ],
          },
          interact: {
            start: ['redirect'],
            finish: {
              method: 'redirect',
              uri: finishInteractUrl,
              nonce: nonce || '',
            },
          },
        },
      )

      if (!isPendingGrant(grant)) {
        throw new Error('Expected interactive outgoing payment grant.')
      }

      return grant
    } catch (error) {
      throw createHTTPException(
        500,
        'Could not retrieve outgoing payment grant.',
        error,
      )
    }
  }

  async createOutgoingPaymentGrant2({
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
    const grant = await this.client!.grant.request(
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

  async completePaymentProcess(
    incomingPaymentId: string | undefined,
    incomingPaymentGrant: Grant | undefined,
    outgoingPaymentId: OutgoingPayment['id'],
    continuationAccessToken: string,
  ): Promise<CheckPaymentResult> {
    if (
      incomingPaymentGrant &&
      !isFinalizedGrantWithAccessToken(incomingPaymentGrant)
    ) {
      throw new Error('Expected incoming payment grant with access token')
    }
    let attempts = 0
    await sleep(OUTGOING_PAYMENT_POLLING_INITIAL_DELAY)
    while (++attempts <= OUTGOING_PAYMENT_POLLING_MAX_ATTEMPTS) {
      const outgoingPayment = await this.client!.outgoingPayment.get({
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

    try {
      if (incomingPaymentId && incomingPaymentGrant) {
        await this.client!.incomingPayment.complete({
          url: incomingPaymentId,
          accessToken: incomingPaymentGrant.access_token.value,
        })
      }
    } catch (error) {
      throw createHTTPException(
        500,
        'Could not complete incoming payment. ',
        error,
      )
    }
    // revoke grant to avoid leaving users with unused, dangling grants.
    if (incomingPaymentGrant) {
      await this.revokeIncomingPaymentGrant(incomingPaymentGrant).catch(
        (error) => {
          throw createHTTPException(
            500,
            'Could not revoke incoming payment grant.',
            error,
          )
        },
      )
    }

    return { success: true }
  }
}

const isOpenPaymentsClientError = (error: unknown) =>
  error instanceof OpenPaymentsClientError

// happens during quoting only
export const isNonPositiveAmountError = (
  error: unknown,
): error is OpenPaymentsClientError & {
  details?: { minSendAmount?: AmountType }
} => {
  if (!isOpenPaymentsClientError(error)) return false
  return (
    error.status === 400 &&
    error.description?.toLowerCase()?.includes('non-positive receive amount')
  )
}
