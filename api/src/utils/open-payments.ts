import {
  type PendingGrant,
  type WalletAddress,
  type AuthenticatedClient,
  type Quote,
  type Grant,
  isFinalizedGrant,
  isPendingGrant,
  createAuthenticatedClient
} from '@interledger/open-payments'
import {
  createHeaders,
  toWalletAddressUrl,
  timeout,
  createHTTPException
} from './utils.js'
import { createId } from '@paralleldrive/cuid2'
import type { Env } from '../index.js'

export interface Amount {
  value: string
  assetCode: string
  assetScale: number
}

export type CreatePayment = { quote: Quote; incomingPaymentGrant: Grant }

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
  debitAmount: Amount
  receiveAmount?: Amount
  nonce?: string
  paymentId: string
}

export class OpenPaymentsService {
  private client: AuthenticatedClient | null = null
  private static _instance: OpenPaymentsService
  private readonly frontendUrl: string
  private constructor(env: Env) {
    this.frontendUrl = env.FRONTEND_URL
  }

  public static async getInstance(env: Env): Promise<OpenPaymentsService> {
    if (!OpenPaymentsService._instance) {
      OpenPaymentsService._instance = new OpenPaymentsService(env)
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
              : undefined
          },
          privateKey: Buffer.from(OP_PRIVATE_KEY, 'base64'),
          keyId: OP_KEY_ID
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
        initialRequest.headers.set(
          'Signature-Input',
          headers['Signature-Input']
        )

        return initialRequest as typeof request
      }
    })
  }

  async createPaymentQuote(args: {
    senderWalletAddress: string
    receiverWalletAddress: string
    amount: number
    note?: string
  }) {
    const receiverWallet = await this.getWalletAddress(
      args.receiverWalletAddress
    )
    const { quote, incomingPaymentGrant } = await this.fetchQuote(
      {
        walletAddress: args.senderWalletAddress,
        amount: args.amount,
        note: args.note
      },
      receiverWallet
    )

    if (!receiverWallet) {
      throw new Error('Invalid receiver wallet address')
    }

    return {
      incomingPaymentGrant,
      quote
    }
  }

  private async fetchQuote(
    args: {
      walletAddress: string
      amount: number
      note?: string
    },
    receiverWallet: WalletAddress
  ): Promise<CreatePayment> {
    const walletAddress = await this.getWalletAddress(args.walletAddress)

    const amountObj = {
      value: BigInt(
        (args.amount * 10 ** walletAddress.assetScale).toFixed()
      ).toString(),
      assetCode: walletAddress.assetCode,
      assetScale: walletAddress.assetScale
    }

    const incomingPaymentGrant = await this.createIncomingPaymentGrant(
      receiverWallet.authServer
    )

    // create incoming payment without incoming amount
    const incomingPayment = await this.createIncomingPayment({
      accessToken: incomingPaymentGrant.access_token.value,
      walletAddress: receiverWallet,
      note: args.note
    })

    const quoteGrant = await this.createQuoteGrant({
      authServer: walletAddress.authServer
    })

    if (isPendingGrant(quoteGrant)) {
      throw new Error('Expected non-interactive grant')
    }

    // create quote with debit amount, you don't care how much money receiver gets
    const quote = await this.client!.quote.create(
      {
        url: walletAddress.resourceServer,
        accessToken: quoteGrant.access_token.value
      },
      {
        method: 'ilp',
        walletAddress: walletAddress.id,
        receiver: incomingPayment.id,
        debitAmount: amountObj
      }
    ).catch(() => {
      throw new Error(
        `Could not create quote for receiver ${receiverWallet.publicName}.`
      )
    })

    return {
      quote,
      incomingPaymentGrant
    }
  }

  async initializePayment(args: {
    walletAddress: WalletAddress
    debitAmount: Amount
    receiveAmount: Amount
  }): Promise<PendingGrant> {
    const clientNonce = crypto.randomUUID()
    const paymentId = createId()

    const outgoingPaymentGrant = await this.createOutgoingPaymentGrant({
      walletAddress: args.walletAddress,
      debitAmount: args.debitAmount,
      receiveAmount: args.receiveAmount,
      nonce: clientNonce,
      paymentId: paymentId,
      redirectUrl: this.frontendUrl + 'payment-confirmation'
    })

    return outgoingPaymentGrant
  }

  async finishPaymentProcess(
    walletAddress: WalletAddress,
    pendingGrant: PendingGrant,
    quote: Quote,
    incomingPaymentGrant: Grant,
    interactRef: string
  ): Promise<CheckPaymentResult> {
    const continuation = await this.client!.grant.continue(
      {
        url: pendingGrant.continue.uri,
        accessToken: pendingGrant.continue.access_token.value
      },
      {
        interact_ref: interactRef
      }
    )

    if (!isFinalizedGrant(continuation)) {
      throw new Error('Expected finalized grant.')
    }

    const url = new URL(walletAddress.resourceServer).origin

    const outgoingPayment = await this.client!.outgoingPayment.create(
      {
        url: url,
        accessToken: continuation.access_token.value
      },
      {
        walletAddress: walletAddress.id,
        quoteId: quote.id,
        metadata: {
          description: 'Tools Payment'
        }
      }
    ).catch(() => {
      throw new Error('Could not create outgoing payment.')
    })

    return await this.checkOutgoingPayment(
      outgoingPayment.id,
      continuation.access_token.value,
      incomingPaymentGrant,
      quote.receiver
    )
  }

  private async createIncomingPaymentGrant(urlAuthServer: string) {
    const nonInteractiveGrant = await this.client!.grant.request(
      {
        url: urlAuthServer
      },
      {
        access_token: {
          access: [
            {
              type: 'incoming-payment',
              actions: ['read', 'create', 'complete']
            }
          ]
        }
      }
    )

    if (isPendingGrant(nonInteractiveGrant)) {
      throw new Error('Expected non-interactive grant')
    }

    return nonInteractiveGrant
  }

  private async revokeIncomingPaymentGrant(incomingPaymentGrant: Grant) {
    await this.client!.grant.cancel({
      url: incomingPaymentGrant.continue.uri,
      accessToken: incomingPaymentGrant.continue.access_token.value
    })
  }

  private async createIncomingPayment({
    accessToken,
    walletAddress,
    note
  }: CreateIncomingPaymentParams) {
    // create incoming payment without amount
    return await this.client!.incomingPayment.create(
      {
        url: walletAddress.resourceServer,
        accessToken: accessToken
      },
      {
        expiresAt: new Date(Date.now() + 6000 * 60).toISOString(),
        walletAddress: walletAddress.id,
        metadata: {
          description: note
        }
      }
    ).catch(() => {
      throw new Error('Unable to create incoming payment.')
    })
  }

  private async createQuoteGrant({ authServer }: QuoteGrantParams) {
    return await this.client!.grant.request(
      {
        url: authServer
      },
      {
        access_token: {
          access: [{ type: 'quote', actions: ['create', 'read'] }]
        }
      }
    ).catch(() => {
      throw new Error('Could not retrieve quote grant.')
    })
  }

  private async createOutgoingPaymentGrant(
    params: CreateOutgoingPaymentParams & { redirectUrl?: string }
  ): Promise<PendingGrant> {
    const {
      walletAddress,
      debitAmount,
      nonce,
      paymentId,
      redirectUrl,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      receiveAmount
    } = params

    const grant = await this.client!.grant.request(
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
    ).catch((error) => {
      throw new Error('Could not retrieve outgoing payment grant.', {
        cause: error
      })
    })

    if (!isPendingGrant(grant)) {
      throw new Error('Expected interactive outgoing payment grant.')
    }

    return grant
  }

  private async checkOutgoingPayment(
    finishPaymentUrl: string,
    continuationAccessToken: string,
    incomingPaymentGrant: Grant,
    incomingPaymentId: string
  ): Promise<CheckPaymentResult> {
    await timeout(3000)

    // get outgoing payment, to check if there was enough balance
    const checkOutgoingPaymentResponse = await this.client!.outgoingPayment.get(
      {
        url: finishPaymentUrl,
        accessToken: continuationAccessToken
      }
    )

    if (!(Number(checkOutgoingPaymentResponse.sentAmount.value) > 0)) {
      return {
        success: false,
        error: {
          code: 'INSUFFICIENT_BALANCE',
          message: 'Insufficient funds. Check your balance and try again.'
        }
      }
    }

    try {
      await this.client!.incomingPayment.complete({
        url: incomingPaymentId,
        accessToken: incomingPaymentGrant.access_token.value
      })
    } catch (error) {
      throw createHTTPException(
        500,
        'Could not complete incoming payment. ',
        error
      )
    }
    // revoke grant to avoid leaving users with unused, dangling grants.
    await this.revokeIncomingPaymentGrant(incomingPaymentGrant)

    return { success: true }
  }

  private async getWalletAddress(url: string): Promise<WalletAddress> {
    const walletAddress = await this.client!.walletAddress.get({
      url: toWalletAddressUrl(url)
    }).catch(() => {
      throw new Error('Invalid wallet address.')
    })

    return walletAddress
  }
}
