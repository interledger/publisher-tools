import { z } from 'zod'
import {
  bannerFieldsSchema,
  buttonFieldsSchema,
  widgetFieldsSchema
} from './validate.shared'
import type { ElementConfigType } from '@shared/types'
import type {
  PaymentStatus,
  PaymentStatusSuccess,
  PaymentStatusRejected
} from '@shared/types/payment.js'

export const elementConfigStorageSchema = z
  .object({
    versionName: z.string(),
    tag: z.string().optional(),
    // can be undefined initially
    walletAddress: z.string().optional()
  })
  .merge(buttonFieldsSchema)
  .merge(bannerFieldsSchema)
  .merge(widgetFieldsSchema)

/**
 * Validates configurations from localStorage.
 *
 * @param configurations
 * @returns Validation result with success flag and either validated configurations or error details
 */
export const validateConfigurations = (
  configurations: Record<
    'version1' | 'version2' | 'version3',
    ElementConfigType
  >
) => {
  const configurationsSchema = z
    .record(z.string(), elementConfigStorageSchema)
    .optional()
  return configurationsSchema.safeParse(configurations)
}

export const PaymentStatusSuccessSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  hash: z.string().min(1, 'Hash is required'),
  interact_ref: z.string().min(1, 'Interact reference is required')
}) satisfies z.ZodType<PaymentStatusSuccess>

export const PaymentStatusRejectedSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  result: z.literal('grant_rejected')
}) satisfies z.ZodType<PaymentStatusRejected>

export const validatePaymentParams = (params: Record<string, string>) => {
  return (
    z.union([
      PaymentStatusSuccessSchema,
      PaymentStatusRejectedSchema
    ]) satisfies z.ZodType<PaymentStatus>
  ).safeParse(params)
}
