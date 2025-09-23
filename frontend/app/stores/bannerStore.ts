import { proxy } from 'valtio'
import type {
  FontFamilyKey,
  SlideAnimationType,
  BannerPositionKey,
  CornerType
} from '@shared/types'

export interface BannerConfigType {
  // general config
  versionName: string
  walletAddress: string

  // banner-specific properties
  bannerFontName: FontFamilyKey
  bannerFontSize: number
  bannerTitleText: string
  bannerDescriptionText: string
  bannerDescriptionVisible: boolean
  bannerSlideAnimation: SlideAnimationType
  bannerPosition: BannerPositionKey
  bannerBorder: CornerType
  bannerTextColor: string
  bannerBackgroundColor: string
  bannerThumbnail: string
}

export interface BannerStoreType {
  configuration: BannerConfigType

  // handlers
  onTitleChange: (title: string) => void
  onDescriptionChange: (description: string) => void
  onDescriptionVisibilityChange: (visible: boolean) => void
  onFontNameChange: (fontName: FontFamilyKey) => void
  onFontSizeChange: (fontSize: number) => void
  onBackgroundColorChange: (color: string) => void
  onTextColorChange: (color: string) => void
  onBorderChange: (border: CornerType) => void
  onPositionChange: (position: BannerPositionKey) => void
  onSlideAnimationChange: (animation: SlideAnimationType) => void
  onThumbnailVisibilityChange: (visible: boolean) => void
}

function createDefaultBannerConfig(): BannerConfigType {
  return {
    versionName: 'Banner preset 1',
    walletAddress: '',
    bannerFontName: 'Arial',
    bannerFontSize: 16,
    bannerTitleText: 'Support this site',
    bannerDescriptionText: 'This site is web monetized',
    bannerDescriptionVisible: true,
    bannerSlideAnimation: 'Slide',
    bannerPosition: 'Top',
    bannerBorder: 'Light',
    bannerTextColor: '#000000',
    bannerBackgroundColor: '#ffffff',
    bannerThumbnail: 'default'
  }
}

export function createDataStoreBanner(): BannerStoreType {
  const initialConfig = createDefaultBannerConfig()

  const store = proxy<BannerStoreType>({
    configuration: initialConfig,

    onTitleChange(title: string) {
      store.configuration.bannerTitleText = title
    },

    onDescriptionChange(description: string) {
      store.configuration.bannerDescriptionText = description
    },

    onDescriptionVisibilityChange(visible: boolean) {
      store.configuration.bannerDescriptionVisible = visible
    },

    onFontNameChange(fontName: FontFamilyKey) {
      store.configuration.bannerFontName = fontName
    },

    onFontSizeChange(fontSize: number) {
      store.configuration.bannerFontSize = fontSize
    },

    onBackgroundColorChange(color: string) {
      store.configuration.bannerBackgroundColor = color
    },

    onTextColorChange(color: string) {
      store.configuration.bannerTextColor = color
    },

    onBorderChange(border: CornerType) {
      store.configuration.bannerBorder = border
    },

    onPositionChange(position: BannerPositionKey) {
      store.configuration.bannerPosition = position
    },

    onSlideAnimationChange(animation: SlideAnimationType) {
      store.configuration.bannerSlideAnimation = animation
    },

    onThumbnailVisibilityChange(visible: boolean) {
      store.configuration.bannerThumbnail = visible ? 'default' : ''
    }
  })

  return store
}
