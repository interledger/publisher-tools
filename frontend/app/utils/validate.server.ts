import { z } from 'zod'
import {
  checkHrefFormat,
  getWalletAddress,
  toWalletAddressUrl,
  WalletAddressFormatError
} from '@shared/utils'
import {
  bannerFieldsSchema,
  buttonFieldsSchema,
  widgetFieldsSchema
} from './validate.shared'
import type {
  PaymentStatus,
  PaymentStatusRejected,
  PaymentStatusSuccess
} from 'publisher-tools-api'

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
          code: z.ZodIssueCode.custom,
          message:
            e instanceof WalletAddressFormatError
              ? e.message
              : 'Invalid wallet address format'
        })
      }
    })
})

export const versionSchema = z.object({
  version: z.string().min(1, { message: 'Version is required' })
})

// TODO: need a better definition & validation for this
export const fullConfigSchema = z.object({
  fullconfig: z.string().min(1, { message: 'Unknown error' })
})

export const createButtonSchema = z
  .object({
    elementType: z.literal('button')
  })
  .merge(buttonFieldsSchema)
  .merge(walletSchema)
  .merge(versionSchema)

export const createBannerSchema = z
  .object({
    elementType: z.literal('banner')
  })
  .merge(bannerFieldsSchema)
  .merge(walletSchema)
  .merge(versionSchema)

export const createWidgetSchema = z
  .object({
    elementType: z.literal('widget')
  })
  .merge(widgetFieldsSchema)
  .merge(walletSchema)
  .merge(versionSchema)

export const getElementSchema = (type: string) => {
  switch (type) {
    case 'banner':
      return createBannerSchema
    case 'widget':
      return createWidgetSchema
    case 'button':
    default:
      return createButtonSchema
  }
}

export const validateForm = async (
  formData: {
    [k: string]: FormDataEntryValue
  },
  elementType?: string
) => {
  const intent = formData?.intent
  let result
  if (intent === 'import' || intent === 'delete') {
    result = await walletSchema.safeParseAsync(formData)
  } else if (intent === 'newversion') {
    const newVersionSchema = versionSchema.merge(walletSchema)
    result = await newVersionSchema.safeParseAsync(formData)
  } else {
    let currentSchema

    switch (elementType) {
      case 'button':
        currentSchema = createButtonSchema
        break
      case 'widget':
        currentSchema = createWidgetSchema
        break
      case 'banner':
      default:
        currentSchema = createBannerSchema
    }
    result = await currentSchema
      .merge(fullConfigSchema)
      .safeParseAsync(Object.assign(formData, { ...{ elementType } }))
  }
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const payload = result.data as unknown as any

  return { result, payload }
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
