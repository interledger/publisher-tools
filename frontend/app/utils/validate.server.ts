import type {
  PaymentStatus,
  PaymentStatusRejected,
  PaymentStatusSuccess,
} from 'publisher-tools-api/src/routes/payment/status'
import z from 'zod'
import {
  checkHrefFormat,
  getWalletAddress,
  toWalletAddressUrl,
  WalletAddressFormatError,
} from '@shared/utils'

// TODO: refactor walletSchema to .transform() and return WalletAddress object directly from getWalletAddress
export const walletSchema = z.object({
  walletAddress: z
    .string()
    .min(1, { message: 'Wallet address is required' })
    .transform((url) => toWalletAddressUrl(url))
    .superRefine(async (updatedUrl, ctx) => {
      if (updatedUrl.length === 0) return

      try {
        checkHrefFormat(updatedUrl)
        await getWalletAddress(updatedUrl)
      } catch (e) {
        ctx.addIssue({
          code: 'custom',
          message:
            e instanceof WalletAddressFormatError
              ? e.message
              : 'Invalid wallet address format',
        })
      }
    }),
})

export const PaymentStatusSuccessSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  hash: z.string().min(1, 'Hash is required'),
  interact_ref: z.string().min(1, 'Interact reference is required'),
}) satisfies z.ZodType<PaymentStatusSuccess>

export const PaymentStatusRejectedSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  result: z.literal('grant_rejected'),
}) satisfies z.ZodType<PaymentStatusRejected>

const PaymentStatusSchema = z.union([
  PaymentStatusSuccessSchema,
  PaymentStatusRejectedSchema,
]) satisfies z.ZodType<PaymentStatus>

export const validatePaymentParams = (params: Record<string, string>) => {
  return PaymentStatusSchema.safeParse(params)
}
