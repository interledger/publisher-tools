import z from 'zod'
import type { BannerProfile, WidgetProfile } from '@shared/types'
import {
  CORNER_OPTION,
  BANNER_POSITION,
  WIDGET_POSITION,
  SLIDE_ANIMATION,
  WIDGET_FONT_SIZES,
  FONT_FAMILY_OPTIONS,
  BANNER_TITLE_MAX_LENGTH,
  BANNER_DESCRIPTION_MAX_LENGTH,
  WIDGET_TITLE_MAX_LENGTH,
  WIDGET_DESCRIPTION_MAX_LENGTH,
  BANNER_FONT_SIZE_KEYS,
} from '@shared/types'

const widgetFontSizeError = {
  message: `Font size must be between ${WIDGET_FONT_SIZES.min} and ${WIDGET_FONT_SIZES.max}`,
}

export const buttonFieldsSchema = z.object({
  buttonFontName: z.string().min(1, { message: 'Choose a font' }),
  buttonText: z.string().min(1, { message: 'Button label cannot be empty' }),
  buttonBorder: z.enum(CORNER_OPTION),
  buttonTextColor: z.string().min(6),
  buttonBackgroundColor: z.string().min(6),
  buttonDescriptionText: z.string().optional(),
})

const hexColorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6})$/, 'Invalid hex color')
const gradientSchema = z.object({
  gradient: z.string(),
})

export const bannerFieldsSchema = z.object({
  title: z.object({
    text: z
      .string()
      .max(BANNER_TITLE_MAX_LENGTH, { message: 'Title is too long' }),
  }),
  description: z.object({
    text: z.string().max(BANNER_DESCRIPTION_MAX_LENGTH, {
      message: 'Description is too long',
    }),
    isVisible: z.boolean(),
  }),
  font: z.object({
    name: z.enum(FONT_FAMILY_OPTIONS, {
      message: 'Choose a valid font family',
    }),
    size: z.enum(BANNER_FONT_SIZE_KEYS, {
      message: 'Choose a valid font size',
    }),
  }),
  animation: z.object({
    type: z.enum(SLIDE_ANIMATION),
  }),
  position: z.enum(BANNER_POSITION),
  border: z.object({
    type: z.enum(CORNER_OPTION),
  }),
  color: z.object({
    text: hexColorSchema,
    background: z.union([hexColorSchema, gradientSchema]),
  }),
  thumbnail: z.object({
    value: z.string(),
  }),
})

export const BannerProfileSchema = bannerFieldsSchema.extend({
  $version: z.string(),
  $name: z.string(),
  $modifiedAt: z.string().optional(),
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
  widgetButtonBackgroundColor: z.string().min(1),
  widgetButtonTextColor: z.string().min(1),
  widgetTextColor: z.string().min(1),
  widgetBackgroundColor: z.string().min(1),
  widgetTriggerBackgroundColor: z.string().min(1),
  widgetTriggerIcon: z.string(),
})

export const WidgetProfileSchema = z.object({
  ...widgetFieldsSchema.shape,
  $version: z.string(),
  $name: z.string(),
}) satisfies z.ZodType<WidgetProfile>
