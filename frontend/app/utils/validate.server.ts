import type {
  PaymentStatus,
  PaymentStatusRejected,
  PaymentStatusSuccess
} from 'publisher-tools-api'
import z from 'zod'
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
              : 'Invalid wallet address format'
        })
      }
    })
})

/** @deprecated */
export const versionSchema = z.object({
  version: z.string().min(1, { message: 'Version is required' })
})

/** @deprecated */
export const fullConfigSchema = z.object({
  fullconfig: z.string().min(1, { message: 'Unknown error' })
})
/** @deprecated */
export const createButtonSchema = z.object({
  elementType: z.literal('button'),
  ...buttonFieldsSchema.shape,
  ...walletSchema.shape,
  ...versionSchema.shape
})
/** @deprecated */
export const createBannerSchema = z.object({
  elementType: z.literal('banner'),
  ...bannerFieldsSchema.shape,
  ...walletSchema.shape,
  ...versionSchema.shape
})
/** @deprecated */
export const createWidgetSchema = z.object({
  elementType: z.literal('widget'),
  ...widgetFieldsSchema.shape,
  ...walletSchema.shape,
  ...versionSchema.shape
})

/** @deprecated */
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

/** @deprecated */
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
    const newVersionSchema = z.object({
      ...versionSchema.shape,
      ...walletSchema.shape
    })
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
    const mergedSchema = z.object({
      ...currentSchema.shape,
      ...fullConfigSchema.shape
    })
    result = await mergedSchema.safeParseAsync(
      Object.assign(formData, { ...{ elementType } })
    )
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

const PaymentStatusSchema = z.union([
  PaymentStatusSuccessSchema,
  PaymentStatusRejectedSchema
]) satisfies z.ZodType<PaymentStatus>

export const validatePaymentParams = (params: Record<string, string>) => {
  return PaymentStatusSchema.safeParse(params)
}
