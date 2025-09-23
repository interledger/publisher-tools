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

export const createDataStoreBanner = (): BannerStoreType =>
  proxy({ configuration: createDefaultBannerConfig() })
