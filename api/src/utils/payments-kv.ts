import type {
  KVNamespace,
  KVNamespacePutOptions,
} from '@cloudflare/workers-types'
import type {
  GrantWithAccessToken,
  PendingGrant,
} from '@interledger/open-payments'
import type { Amount } from '@shared/types'
import type { WalletAddressInfo } from '../types'

export const KV_PAYMENTS_PREFIX = 'payments/'

export type PaymentKvData =
  | {
      status: 'PENDING'
      quoteId: string
      incomingPaymentId: string
      redirectUrl: string
      grantContinuation: PendingGrant['continue']
      nonce: string
      sender: WalletAddressInfo
      receiver: WalletAddressInfo
      amount: Amount
      metadata: Record<string, unknown>
    }
  | {
      status: 'GRANT_REJECTED'
    }
  | {
      status: 'CREATED'
      // For polling of outgoing payment completion
      outgoingPaymentId: string
      incomingPaymentId: string
      sender: WalletAddressInfo
      receiver: WalletAddressInfo
      amount: Amount
      redirectUrl: string
      // For expiring resources/grants when done
      outgoingPaymentGrantAccessToken: GrantWithAccessToken['access_token']['value']
    }
  | {
      status: 'COMPLETE'
      outgoingPaymentId: string
      incomingPaymentId: string
      sender: WalletAddressInfo
      receiver: WalletAddressInfo
      amount: Amount
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
