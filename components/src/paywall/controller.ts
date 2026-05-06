import type { PaymentStatus, WalletAddressInfo } from 'publisher-tools-api'
import type { PendingGrant } from '@interledger/open-payments'
import { createDefaultPaywallProfile } from '@shared/default-data'
import type { PaywallProfile } from '@shared/types'

type WalletAddressUrl = string
/** The amount sender wants to send (like "1.05"), does not include fees */
type UserAmount = number | PaymentCurrencyAmount['value']

interface QuoteInput {
  sender: WalletAddressInfo
  receiver: WalletAddressInfo
  amount: UserAmount
}
type QuoteResult =
  | { debitAmount: PaymentCurrencyAmount; receiveAmount: PaymentCurrencyAmount }
  | { error: string; minSendAmount?: PaymentCurrencyAmount }

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

type Entitlement = 'no-access' | 'auth-required' | 'has-access'

export interface Controller {
  fetchConfig(): Promise<PaywallProfile>

  /** Check if given wallet address is entitled to access */
  checkEntitlement(walletAddressUrl: WalletAddressUrl): Promise<Entitlement>
  /** Store the entitlement after a successful payment in some backend */
  saveEntitlement(
    walletAddressUrl: WalletAddressUrl,
    details: {
      outgoingPaymentId: string
      incomingPaymentId: string
      paymentId: string
    },
  ): Promise<void>

  getWallet(walletAddressUrl: WalletAddressUrl): Promise<WalletAddressInfo>
  fetchQuote(request: QuoteInput): Promise<QuoteResult>
  initiatePayment(request: InitiatePaymentInput): Promise<InitiatePaymentResult>
  getStatus(
    paymentId: string,
    signal?: AbortSignal,
  ): AsyncGenerator<PaymentStatus>

  isPreviewMode?: boolean
}

export const NO_OP_CONTROLLER: Controller = {
  fetchConfig: () => Promise.resolve(createDefaultPaywallProfile('')),
  checkEntitlement: () => Promise.resolve('no-access'),
  saveEntitlement: () => Promise.resolve(),
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
  fetchQuote({ amount, sender, receiver }) {
    amount = String(amount)
    const debitAmount = { value: amount, currency: sender.assetCode }
    const receiveAmount = { value: amount, currency: receiver.assetCode }
    return Promise.resolve({ debitAmount, receiveAmount })
  },
  initiatePayment() {
    return Promise.resolve({
      paymentId: 'payment-id',
      grantRedirectUrl: 'https://example.com/redirect',
    })
  },
  async *getStatus() {
    yield {
      type: 'OUTGOING_PAYMENT_DONE',
      outgoingPaymentId: '',
      result: 'success',
    }
  },
}
