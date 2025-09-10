import { z } from 'zod'
import {
  CORNER_OPTION,
  BANNER_POSITION,
  WIDGET_POSITION,
  SLIDE_ANIMATION,
  BANNER_FONT_SIZES,
  WIDGET_FONT_SIZES,
  FONT_FAMILY_OPTIONS
} from '@shared/types'

const bannerFontSizeError = {
  message: `Value has to be between ${BANNER_FONT_SIZES.min} and ${BANNER_FONT_SIZES.max}`
}
const widgetFontSizeError = {
  message: `Value has to be between ${WIDGET_FONT_SIZES.min} and ${WIDGET_FONT_SIZES.max}`
}

export const buttonFieldsSchema = z.object({
  buttonFontName: z.string().min(1, { message: 'Choose a font' }),
  buttonText: z.string().min(1, { message: 'Button label cannot be empty' }),
  buttonBorder: z.nativeEnum(CORNER_OPTION),
  buttonTextColor: z.string().min(6),
  buttonBackgroundColor: z.string().min(6),
  buttonDescriptionText: z.string().optional()
})

export const bannerFieldsSchema = z.object({
  bannerFontName: z.enum(FONT_FAMILY_OPTIONS, { message: 'Choose a font' }),
  bannerFontSize: z.coerce
    .number()
    .min(BANNER_FONT_SIZES.min, bannerFontSizeError)
    .max(BANNER_FONT_SIZES.max, bannerFontSizeError),
  bannerTitleText: z.string().optional(),
  bannerDescriptionText: z.string().optional(),
  bannerTextColor: z.string().min(6),
  bannerBackgroundColor: z.string().min(6),
  bannerSlideAnimation: z.nativeEnum(SLIDE_ANIMATION),
  bannerThumbnail: z.string().optional(),
  bannerPosition: z.nativeEnum(BANNER_POSITION),
  bannerBorder: z.nativeEnum(CORNER_OPTION)
})

export const widgetFieldsSchema = z.object({
  widgetFontName: z.enum(FONT_FAMILY_OPTIONS, { message: 'Choose a font' }),
  widgetFontSize: z.coerce
    .number()
    .min(WIDGET_FONT_SIZES.min, widgetFontSizeError)
    .max(WIDGET_FONT_SIZES.max, widgetFontSizeError),
  widgetTitleText: z
    .string()
    .min(1, { message: 'Widget title cannot be empty' }),
  widgetDescriptionText: z.string().optional(),
  widgetPosition: z.nativeEnum(WIDGET_POSITION),
  widgetDonateAmount: z.coerce
    .number()
    .min(0, { message: 'Donate amount must be positive' }),
  widgetButtonText: z
    .string()
    .min(1, { message: 'Button text cannot be empty' }),
  widgetButtonBorder: z.nativeEnum(CORNER_OPTION),
  widgetButtonBackgroundColor: z.string().min(1),
  widgetButtonTextColor: z.string().min(1),
  widgetTextColor: z.string().min(1),
  widgetBackgroundColor: z.string().min(1),
  widgetTriggerBackgroundColor: z.string().min(1),
  widgetTriggerIcon: z.string().optional()
})
