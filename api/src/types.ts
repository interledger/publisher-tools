export type { WalletAddressInfo } from './routes/wallet'
export type {
  PaymentQuoteInput,
  PaymentQuoteResult,
  PaymentInitiateInput,
  PaymentInitiateResult,
  PaymentStatus,
} from './routes/payment'

export type ApiErrorResponse = {
  error: {
    status: number
    statusText?: string
    message: string
    details?: {
      message?: string
    }
  }
}
