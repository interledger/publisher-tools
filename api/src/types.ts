export type {
  PaymentFinalizeInput,
  PaymentGrantInput,
  PaymentQuoteInput,
  PaymentStatusParam,
  PaymentStatus,
  PaymentStatusRejected,
  PaymentStatusSuccess,
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
