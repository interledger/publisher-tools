import type {
  PaywallPaymentStatus,
  WalletAddressInfo,
} from 'publisher-tools-api'
import type { PendingGrant } from '@interledger/open-payments'
import { createDefaultPaywallProfile } from '@shared/default-data'
import type { PaywallProfile } from '@shared/types'

type WalletAddressUrl = string
/** The amount sender wants to send (like "1.05"), does not include fees */
type UserAmount = number | PaymentCurrencyAmount['value']

interface InitiatePaymentInput {
  sender: WalletAddressInfo
  receiver: WalletAddressInfo
  amount: UserAmount
  note: string
}
interface InitiatePaymentResult {
  paymentId: string
  grantRedirectUrl: PendingGrant['interact']['redirect']
}

type Entitlement = 'no-access' | 'auth-required' | 'has-access' | 'pending'

export type View = {
  home: undefined
  form: { walletAddress?: string; isAuthMode?: boolean }
  verify: { paymentId: string; sender?: WalletAddressInfo }
  authenticate: { sender?: WalletAddressInfo }
}

export type ViewInfo = {
  [K in keyof View]: { type: K; data: View[K] }
}[keyof View]

export interface Actions {
  setView<K extends keyof View>(
    ...args: View[K] extends undefined
      ? [type: K, data?: View[K]]
      : [type: K, data: View[K]]
  ): void
}

export interface Controller {
  receiverWalletAddressUrl: string
  cdnUrl: string

  fetchConfig(): Promise<PaywallProfile>

  senderWalletAddressUrl?: string | null
  /** Check if given wallet address is entitled to access */
  checkEntitlement(walletAddress?: WalletAddressInfo): Promise<{
    entitlement: Entitlement
    paymentId?: string
  }>
  authenticate(
    walletAddress: WalletAddressInfo,
  ): Promise<{ grantRedirectUrl: string }>

  getWallet(walletAddressUrl: WalletAddressUrl): Promise<WalletAddressInfo>
  initiatePayment(request: InitiatePaymentInput): Promise<InitiatePaymentResult>
  getStatus(
    paymentId: string,
    signal?: AbortSignal,
  ): AsyncGenerator<PaywallPaymentStatus>

  isPreviewMode?: boolean
}

export const NO_OP_CONTROLLER: Controller = {
  cdnUrl: 'https://example.com',
  receiverWalletAddressUrl: 'https://example.com/pay',
  fetchConfig: () => Promise.resolve(createDefaultPaywallProfile('')),
  checkEntitlement: () => Promise.resolve({ entitlement: 'no-access' }),
  authenticate: () => Promise.reject('not-implemented'),
  getWallet(walletAddressUrl) {
    return Promise.resolve({
      $url: walletAddressUrl,
      id: walletAddressUrl,
      assetCode: 'USD',
      assetScale: 2,
      authServer: 'https://auth.example.com',
      resourceServer: 'https://resource.example.com',
      publicName: 'Wallet (Preview)',
    })
  },
  initiatePayment() {
    return Promise.resolve({
      paymentId: 'payment-id',
      grantRedirectUrl: 'https://example.com/redirect',
    })
  },
  async *getStatus() {
    yield {
      type: 'PAYMENT_DONE',
      outgoingPaymentId: '',
      result: 'success',
    }
  },
}
