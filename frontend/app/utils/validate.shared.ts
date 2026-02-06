import z from 'zod'
import type { BannerProfile, WidgetProfile } from '@shared/types'
import {
  CORNER_OPTION,
  BANNER_POSITION,
  WIDGET_POSITION,
  SLIDE_ANIMATION,
  BANNER_FONT_SIZES,
  WIDGET_FONT_SIZES,
  FONT_FAMILY_OPTIONS,
  BANNER_TITLE_MAX_LENGTH,
  BANNER_DESCRIPTION_MAX_LENGTH,
  WIDGET_TITLE_MAX_LENGTH,
  WIDGET_DESCRIPTION_MAX_LENGTH,
} from '@shared/types'

const hexColorSchema = z
  .string()
  .min(4)
  .regex(/^#?[0-9a-fA-F]{3,8}$/, { message: 'Invalid color format' })

const versionSchema = z
  .string()
  .min(1)
  .regex(/^[0-9]{1,2}\.[0-9]{1,3}\.[0-9]{1,4}$/, {
    message: 'Invalid version format',
  })

const assetNameSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_\-/]*$/, { message: 'Invalid asset name' })

const bannerFontSizeError = {
  message: `Font size must be between ${BANNER_FONT_SIZES.min} and ${BANNER_FONT_SIZES.max}`,
}
const widgetFontSizeError = {
  message: `Font size must be between ${WIDGET_FONT_SIZES.min} and ${WIDGET_FONT_SIZES.max}`,
}

/** @deprecated */
export const buttonFieldsSchema = z.object({
  buttonFontName: z.string().min(1, { message: 'Choose a font' }),
  buttonText: z.string().min(1, { message: 'Button label cannot be empty' }),
  buttonBorder: z.enum(CORNER_OPTION),
  buttonTextColor: z.string().min(6),
  buttonBackgroundColor: z.string().min(6),
  buttonDescriptionText: z.string().optional(),
})

/** @legacy */
export const bannerFieldsSchema = z.object({
  bannerFontName: z.enum(FONT_FAMILY_OPTIONS, { message: 'Choose a font' }),
  bannerFontSize: z.coerce
    .number()
    .min(BANNER_FONT_SIZES.min, bannerFontSizeError)
    .max(BANNER_FONT_SIZES.max, bannerFontSizeError),
  bannerTitleText: z
    .string()
    .max(BANNER_TITLE_MAX_LENGTH, { message: 'Title is too long' }),
  bannerDescriptionText: z.string().max(BANNER_DESCRIPTION_MAX_LENGTH, {
    message: 'Description is too long',
  }),
  bannerDescriptionVisible: z.coerce.boolean(),
  bannerTextColor: hexColorSchema,
  bannerBackgroundColor: hexColorSchema,
  bannerSlideAnimation: z.enum(SLIDE_ANIMATION),
  bannerThumbnail: assetNameSchema,
  bannerPosition: z.enum(BANNER_POSITION),
  bannerBorder: z.enum(CORNER_OPTION),
})

export const BannerProfileSchema = z.object({
  ...bannerFieldsSchema.shape,
  $version: versionSchema,
  $name: z.string().min(1).max(40),
}) satisfies z.ZodType<BannerProfile>

/** @legacy */
export const widgetFieldsSchema = z.object({
  widgetFontName: z.enum(FONT_FAMILY_OPTIONS, { message: 'Choose a font' }),
  widgetFontSize: z.coerce
    .number()
    .min(WIDGET_FONT_SIZES.min, widgetFontSizeError)
    .max(WIDGET_FONT_SIZES.max, widgetFontSizeError),
  widgetTitleText: z
    .string()
    .min(1, { message: 'Title cannot be empty' })
    .max(WIDGET_TITLE_MAX_LENGTH, { message: 'Title is too long' }),
  widgetDescriptionText: z.string().max(WIDGET_DESCRIPTION_MAX_LENGTH, {
    message: 'Description is too long',
  }),
  widgetDescriptionVisible: z.coerce.boolean(),
  widgetPosition: z.enum(WIDGET_POSITION),
  widgetDonateAmount: z.coerce
    .number()
    .min(0, { message: 'Donate amount must be positive' }),
  widgetButtonText: z
    .string()
    .min(1, { message: 'Button text cannot be empty' }),
  widgetButtonBorder: z.enum(CORNER_OPTION),
  widgetButtonBackgroundColor: hexColorSchema,
  widgetButtonTextColor: hexColorSchema,
  widgetTextColor: hexColorSchema,
  widgetBackgroundColor: hexColorSchema,
  widgetTriggerBackgroundColor: hexColorSchema,
  widgetTriggerIcon: assetNameSchema,
})

export const WidgetProfileSchema = z.object({
  ...widgetFieldsSchema.shape,
  $version: versionSchema,
  $name: z.string().min(1).max(40),
}) satisfies z.ZodType<WidgetProfile>
