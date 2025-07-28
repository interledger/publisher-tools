import type { BorderRadiusKey } from '../types'

export interface WidgetConfig {
  walletAddress: string
  receiverAddress: string
  amount: string
  currency: string
  action?: string
  note?: string
  widgetTitleText?: string
  widgetDescriptionText?: string
  widgetTriggerIcon?: string
  theme?: {
    primaryColor?: string
    backgroundColor?: string
    textColor?: string
    fontSize?: number
    fontFamily?: string
    widgetBorderRadius?: BorderRadiusKey
    widgetButtonBackgroundColor?: string
  }
  apiUrl?: string
}

export type WalletAddress = {
  id: string
  publicName: string
  assetCode: string
  assetScale: number
  authServer: string
  resourceServer: string
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
