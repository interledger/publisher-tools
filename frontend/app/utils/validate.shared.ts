import z from 'zod'
import type {
  BannerFontSize,
  BannerProfile,
  WidgetFontSize,
  WidgetProfile,
} from '@shared/types'
import {
  CORNER_OPTION,
  BANNER_POSITION,
  WIDGET_POSITION,
  SLIDE_ANIMATION,
  FONT_FAMILY_OPTIONS,
  BANNER_TITLE_MAX_LENGTH,
  BANNER_DESCRIPTION_MAX_LENGTH,
  WIDGET_TITLE_MAX_LENGTH,
  WIDGET_DESCRIPTION_MAX_LENGTH,
  BANNER_FONT_SIZE_MAP,
  WIDGET_FONT_SIZE_MAP,
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

/** @deprecated */
export const buttonFieldsSchema = z.object({
  buttonFontName: z.string().min(1, { message: 'Choose a font' }),
  buttonText: z.string().min(1, { message: 'Button label cannot be empty' }),
  buttonBorder: z.enum(CORNER_OPTION),
  buttonTextColor: z.string().min(6),
  buttonBackgroundColor: z.string().min(6),
  buttonDescriptionText: z.string().optional(),
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
    size: z.enum(Object.keys(BANNER_FONT_SIZE_MAP) as BannerFontSize[], {
      message: 'Select a valid font size',
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
    background: z.union([hexColorSchema]),
  }),
  thumbnail: z.object({
    value: assetNameSchema,
  }),
})

export const BannerProfileSchema = bannerFieldsSchema.extend({
  $version: versionSchema,
  $name: z.string().min(1).max(40),
}) satisfies z.ZodType<BannerProfile>

export const widgetFieldsSchema = z.object({
  title: z.object({
    text: z
      .string()
      .max(WIDGET_TITLE_MAX_LENGTH, { message: 'Title is too long' }),
  }),
  description: z.object({
    text: z.string().max(WIDGET_DESCRIPTION_MAX_LENGTH, {
      message: 'Description is too long',
    }),
    isVisible: z.boolean(),
  }),
  font: z.object({
    name: z.enum(FONT_FAMILY_OPTIONS, {
      message: 'Choose a valid font family',
    }),
    size: z.enum(Object.keys(WIDGET_FONT_SIZE_MAP) as WidgetFontSize[], {
      message: 'Select a valid font size',
    }),
  }),
  position: z.enum(WIDGET_POSITION),
  border: z.object({
    type: z.enum(CORNER_OPTION),
  }),
  color: z.object({
    text: hexColorSchema,
    background: z.union([hexColorSchema]),
    theme: hexColorSchema,
  }),
  ctaPayButton: z.object({
    text: z
      .string()
      .min(1, { message: 'Button label cannot be empty' })
      .max(30, { message: 'Button label is too long' }),
  }),
  icon: z.object({
    value: assetNameSchema,
    color: z.union([hexColorSchema]),
  }),
})

export const WidgetProfileSchema = widgetFieldsSchema.extend({
  $version: versionSchema,
  $name: z.string().min(1).max(40),
}) satisfies z.ZodType<WidgetProfile>
