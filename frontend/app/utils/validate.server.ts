import { z } from 'zod'
import { CornerType, PositionType, SlideAnimationType } from '@shared/types'
import {
  checkHrefFormat,
  getWalletAddress,
  toWalletAddressUrl,
  WalletAddressFormatError
} from '@shared/utils'

const rangeError = { message: 'Value has to be between 16 and 24' }

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
    elementType: z.literal('button'),
    buttonFontName: z.string().min(1, { message: 'Choose a font' }),
    buttonText: z.string().min(1, { message: 'Button label cannot be empty' }),
    buttonBorder: z.nativeEnum(CornerType),
    buttonTextColor: z.string().min(6),
    buttonBackgroundColor: z.string().min(6)
  })
  .merge(walletSchema)
  .merge(versionSchema)

export const createBannerSchema = z
  .object({
    elementType: z.literal('banner'),
    bannerFontName: z.string().min(1, { message: 'Choose a font' }),
    bannerFontSize: z.coerce.number().min(16, rangeError).max(24, rangeError),
    bannerTitleText: z.string().optional(),
    bannerDescriptionText: z
      .string()
      .min(1, { message: 'Banner text cannot be empty' }),
    bannerTextColor: z.string().min(6),
    bannerBackgroundColor: z.string().min(6),
    bannerSlideAnimation: z.nativeEnum(SlideAnimationType),
    bannerPosition: z.nativeEnum(PositionType),
    bannerBorder: z.nativeEnum(CornerType)
  })
  .merge(walletSchema)
  .merge(versionSchema)

export const createWidgetSchema = z
  .object({
    elementType: z.literal('widget'),
    widgetFontName: z.string().min(1, { message: 'Choose a font' }),
    widgetFontSize: z.coerce.number().min(10, rangeError).max(30, rangeError),
    widgetPosition: z.nativeEnum(PositionType),
    widgetButtonText: z.string().min(1),
    widgetDescriptionText: z.string().min(1),
    widgetButtonBorder: z.nativeEnum(CornerType),
    widgetButtonBackgroundColor: z.string().min(1),
    widgetButtonTextColor: z.string().min(1),
    widgetTextColor: z.string().min(1),
    widgetBackgroundColor: z.string().min(1),
    widgetTriggerBackgroundColor: z.string().min(1),
    widgetTriggerIcon: z.string().optional()
  })
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
