import type { WidgetProfile } from '@shared/types'

export interface WidgetConfig {
  walletAddress: string
  receiverAddress: string
  amount: string
  currency: string
  frontendUrl: string
  cdnUrl: string
  apiUrl: string
  profile: WidgetProfile
  note?: string
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
