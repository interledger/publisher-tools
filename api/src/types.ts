import type {
  PaymentFinalizeSchema,
  PaymentGrantSchema,
  PaymentQuoteSchema,
  WalletAddressParamSchema
} from './schemas/payment.js'
import type { z } from 'zod/v4'

type PaymentStatusSuccess = {
  paymentId: string
  hash: string
  interact_ref: string
}

type PaymentStatusRejected = {
  paymentId: string
  result: 'grant_rejected'
}

export function isInteractionSuccess(
  params: PaymentStatus
): params is PaymentStatusSuccess {
  return 'interact_ref' in params
}

export function isInteractionRejected(
  params: PaymentStatus
): params is PaymentStatusRejected {
  return 'result' in params && params.result === 'grant_rejected'
}

export type PaymentStatus = PaymentStatusSuccess | PaymentStatusRejected

export type PaymentQuoteInput = z.infer<typeof PaymentQuoteSchema>
export type PaymentGrantInput = z.infer<typeof PaymentGrantSchema>
export type PaymentFinalizeInput = z.infer<typeof PaymentFinalizeSchema>
export type WalletAddressParams = z.infer<typeof WalletAddressParamSchema>
