import type {
  BorderRadiusKey,
  FontFamilyKey,
  WidgetPositionKey,
} from '@shared/types'

export interface WidgetConfig {
  walletAddress: string
  receiverAddress: string
  amount: string
  currency: string
  action?: string
  note?: string
  widgetTitleText?: string
  widgetDescriptionText?: string
  isWidgetDescriptionVisible?: boolean
  widgetTriggerIcon?: string
  widgetPosition?: WidgetPositionKey
  theme?: {
    primaryColor?: string
    backgroundColor?: string
    textColor?: string
    fontSize?: number
    fontFamily?: FontFamilyKey
    widgetBorderRadius?: BorderRadiusKey
    widgetButtonBackgroundColor?: string
  }
  frontendUrl: string
  cdnUrl: string
  apiUrl: string
}

export type FormattedAmount = {
  amount: number
  amountWithCurrency: string
  symbol: string
}

export interface Amount {
  value: string
  assetCode: string
  assetScale: number
}
export type FormatAmountArgs = Amount & {
  value: string
}
