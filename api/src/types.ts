export type {
  PaymentFinalizeInput,
  PaymentGrantInput,
  PaymentQuoteInput,
  PaymentStatusParam,
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

export type PaymentStatusSuccess = {
  paymentId: string
  hash: string
  interact_ref: string
}

export type PaymentStatusRejected = {
  paymentId: string
  result: 'grant_rejected'
}

export type PaymentStatus = PaymentStatusSuccess | PaymentStatusRejected
