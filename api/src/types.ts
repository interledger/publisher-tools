import type {
  PaymentFinalizeSchema,
  PaymentGrantSchema,
  PaymentQuoteSchema,
  WalletAddressParamSchema
} from './schemas/payment.js'
import type { z } from 'zod/v4'

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

export type PaymentQuoteInput = z.infer<typeof PaymentQuoteSchema>
export type PaymentGrantInput = z.infer<typeof PaymentGrantSchema>
export type PaymentFinalizeInput = z.infer<typeof PaymentFinalizeSchema>
export type WalletAddressParams = z.infer<typeof WalletAddressParamSchema>
