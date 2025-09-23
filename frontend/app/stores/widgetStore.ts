import { proxy } from 'valtio'
import { getDefaultData } from '@shared/default-data'
import type {
  FontFamilyKey,
  WidgetPositionKey,
  CornerType
} from '@shared/types'

export interface WidgetConfigType {
  // general config
  versionName: string
  walletAddress: string

  // widget-specific
  widgetFontName: FontFamilyKey
  widgetFontSize: number
  widgetTitleText: string
  widgetDescriptionText: string
  widgetDescriptionVisible: boolean
  widgetPosition: WidgetPositionKey
  widgetDonateAmount: number
  widgetButtonText: string
  widgetButtonBorder: CornerType
  widgetTextColor: string
  widgetBackgroundColor: string
  widgetButtonTextColor: string
  widgetButtonBackgroundColor: string
  widgetTriggerBackgroundColor: string
  widgetTriggerIcon: string
}

export interface WidgetStoreType {
  configuration: WidgetConfigType
}

function createDefaultWidgetConfig(): WidgetConfigType {
  const defaultData = getDefaultData()
  return {
    versionName: 'Widget preset 1',
    walletAddress: defaultData.walletAddress,
    widgetFontName: defaultData.widgetFontName,
    widgetFontSize: defaultData.widgetFontSize,
    widgetTitleText: defaultData.widgetTitleText,
    widgetDescriptionText: defaultData.widgetDescriptionText,
    widgetDescriptionVisible: defaultData.widgetDescriptionVisible,
    widgetPosition: defaultData.widgetPosition,
    widgetDonateAmount: defaultData.widgetDonateAmount,
    widgetButtonText: defaultData.widgetButtonText,
    widgetButtonBorder: defaultData.widgetButtonBorder,
    widgetTextColor: defaultData.widgetTextColor,
    widgetBackgroundColor: defaultData.widgetBackgroundColor,
    widgetButtonTextColor: defaultData.widgetButtonTextColor,
    widgetButtonBackgroundColor: defaultData.widgetButtonBackgroundColor,
    widgetTriggerBackgroundColor: defaultData.widgetTriggerBackgroundColor,
    widgetTriggerIcon: defaultData.widgetTriggerIcon
  }
}

export const createDataStoreWidget = (): WidgetStoreType =>
  proxy({ configuration: createDefaultWidgetConfig() })
