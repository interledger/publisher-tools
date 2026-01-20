import type {
  ConfigVersions,
  ToolProfiles,
  ProfileId,
  BannerProfile,
  Tool,
  ElementConfigType,
} from '@shared/types'

function toBannerProfile(config: ElementConfigType): BannerProfile {
  return {
    $version: '0.0.1',
    $name: config.versionName,
    $modifiedAt: '',
    bannerTitleText: config.bannerTitleText,
    bannerDescriptionText: config.bannerDescriptionText,
    bannerDescriptionVisible: config.bannerDescriptionVisible,
    bannerFontName: config.bannerFontName,
    bannerFontSize: config.bannerFontSize,
    bannerSlideAnimation: config.bannerSlideAnimation,
    bannerPosition: config.bannerPosition,
    bannerBorder: config.bannerBorder,
    bannerTextColor: config.bannerTextColor,
    bannerBackgroundColor: config.bannerBackgroundColor,
    bannerThumbnail: config.bannerThumbnail,
  }
}

// TODO: to be removed after the completion of versioned configurations
export function convertFrom<T extends Tool>(
  configuration: ConfigVersions,
  _: T,
): ToolProfiles<T> {
  const profiles: Record<string, BannerProfile> = {}

  Object.entries(configuration).forEach(([profileId, config]) => {
    profiles[profileId as ProfileId] = toBannerProfile(config)
  })

  return profiles
}
