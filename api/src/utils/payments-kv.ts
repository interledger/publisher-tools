import type {
  KVNamespace,
  KVNamespacePutOptions,
} from '@cloudflare/workers-types'
import type {
  GrantWithAccessToken,
  PendingGrant,
  WalletAddress,
} from '@interledger/open-payments'

export const KV_PAYMENTS_PREFIX = 'payments/'

export type PaymentKvData =
  | {
      status: 'PENDING'
      quoteId: string
      redirectUrl: string
      grantContinuation: PendingGrant['continue']
      nonce: string
      sender: WalletAddress
      metadata: Record<string, unknown>
    }
  | {
      status: 'CREATED'
      // For polling of outgoing payment completion
      outgoingPaymentId: string
      redirectUrl: string
      // For expiring resources/grants when done
      outgoingPaymentGrantAccessToken: GrantWithAccessToken['access_token']['value']
      sender: WalletAddress
    }
  | {
      status: 'COMPLETE'
      result: 'success' | 'failure'
      error?: {
        code: string
        message: string
        error?: unknown
      }
    }

const getKey = (paymentId: string) => `${KV_PAYMENTS_PREFIX}${paymentId}`

export async function getData(kv: KVNamespace, paymentId: string) {
  const data = await kv.get<PaymentKvData>(getKey(paymentId), 'json')
  return data
}

export async function setData(
  kv: KVNamespace,
  paymentId: string,
  data: PaymentKvData,
  options?: KVNamespacePutOptions,
) {
  await kv.put(getKey(paymentId), JSON.stringify(data), options)
}
