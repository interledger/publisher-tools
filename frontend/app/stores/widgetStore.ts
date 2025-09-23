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

  // handlers
  onTitleChange: (title: string) => void
  onDescriptionChange: (description: string) => void
  onDescriptionVisibilityChange: (visible: boolean) => void
  onFontNameChange: (fontName: FontFamilyKey) => void
  onFontSizeChange: (fontSize: number) => void
  onBackgroundColorChange: (color: string) => void
  onTextColorChange: (color: string) => void
  onButtonColorChange: (color: string) => void
  onBorderChange: (border: CornerType) => void
  onPositionChange: (position: WidgetPositionKey) => void
  onThumbnailVisibilityChange: (visible: boolean) => void
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

export function createDataStoreWidget(): WidgetStoreType {
  const initialConfig = createDefaultWidgetConfig()

  const store = proxy<WidgetStoreType>({
    configuration: initialConfig,

    onTitleChange(title: string) {
      store.configuration.widgetTitleText = title
    },

    onDescriptionChange(description: string) {
      store.configuration.widgetDescriptionText = description
    },

    onDescriptionVisibilityChange(visible: boolean) {
      store.configuration.widgetDescriptionVisible = visible
    },

    onFontNameChange(fontName: FontFamilyKey) {
      store.configuration.widgetFontName = fontName
    },

    onFontSizeChange(fontSize: number) {
      store.configuration.widgetFontSize = fontSize
    },

    onBackgroundColorChange(color: string) {
      store.configuration.widgetBackgroundColor = color
    },

    onTextColorChange(color: string) {
      store.configuration.widgetTextColor = color
    },

    onButtonColorChange(color: string) {
      store.configuration.widgetButtonBackgroundColor = color
    },

    onBorderChange(border: CornerType) {
      store.configuration.widgetButtonBorder = border
    },

    onPositionChange(position: WidgetPositionKey) {
      store.configuration.widgetPosition = position
    },

    onThumbnailVisibilityChange(visible: boolean) {
      store.configuration.widgetTriggerIcon = visible ? 'default' : ''
    }
  })

  return store
}
