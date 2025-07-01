import type {
  PaymentFinalizeSchema,
  PaymentGrantSchema,
  PaymentQuoteSchema,
  WalletAddressParamSchema
} from './schemas/payment.js'
import type { z } from 'zod/v4'

export interface ConfigVersions {
  [key: string]: ElementConfigType
}

export interface ElementConfigType {
  // general config
  css: string
  walletAddress: string

  // button specific
  buttonFontName: string
  buttonText: string
  buttonBorder: CornerType
  buttonTextColor: string
  buttonBackgroundColor: string
  buttonDescriptionText?: string

  // banner specific
  bannerFontName: string
  bannerFontSize: number
  bannerTitleText: string
  bannerDescriptionText: string
  bannerSlideAnimation: SlideAnimationType
  bannerPosition: PositionType
  bannerBorder: CornerType
  bannerTextColor: string
  bannerBackgroundColor: string

  // widget specific
  widgetFontName: string
  widgetFontSize: number
  widgetTitleText: string
  widgetDescriptionText: string
  widgetButtonText: string
  widgetButtonBorder: CornerType
  widgetTextColor: string
  widgetBackgroundColor: string
  widgetButtonTextColor: string
  widgetButtonBackgroundColor: string
  widgetTriggerBackgroundColor: string
  widgetTriggerIcon: string
}

export enum CornerType {
  None = 'None',
  Light = 'Light',
  Pill = 'Pill'
}

export enum SlideAnimationType {
  None = 'None',
  Down = 'Down'
}

export enum PositionType {
  Top = 'Top',
  Bottom = 'Bottom'
}

export type PaymentQuoteInput = z.infer<typeof PaymentQuoteSchema>
export type PaymentGrantInput = z.infer<typeof PaymentGrantSchema>
export type PaymentFinalizeInput = z.infer<typeof PaymentFinalizeSchema>
export type WalletAddressParams = z.infer<typeof WalletAddressParamSchema>
