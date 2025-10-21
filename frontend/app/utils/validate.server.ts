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
import { z } from 'zod/v4'

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

export const versionSchema = z.object({
  version: z.string().min(1, { message: 'Version is required' })
})

// TODO: need a better definition & validation for this
export const fullConfigSchema = z.object({
  fullconfig: z.string().min(1, { message: 'Unknown error' })
})

export const createButtonSchema = z.object({
  elementType: z.literal('button'),
  ...buttonFieldsSchema.shape,
  ...walletSchema.shape,
  ...versionSchema.shape
})

export const createBannerSchema = z.object({
  elementType: z.literal('banner'),
  ...bannerFieldsSchema.shape,
  ...walletSchema.shape,
  ...versionSchema.shape
})

export const createWidgetSchema = z.object({
  elementType: z.literal('widget'),
  ...widgetFieldsSchema.shape,
  ...walletSchema.shape,
  ...versionSchema.shape
})

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
