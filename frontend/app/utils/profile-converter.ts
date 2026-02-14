import type {
  ConfigVersions,
  ToolProfiles,
  ProfileId,
  Tool,
  ElementConfigType,
  Configuration,
  ToolProfile,
  BaseToolProfile,
} from '@shared/types'
import {
  numberToBannerFontSize,
  numberToWidgetFontSize,
  bannerFontSizeToNumber,
  widgetFontSizeToNumber,
} from '@shared/types'

function convertToProfile<T extends Tool>(
  config: ElementConfigType,
  tool: T,
): ToolProfile<T> {
  return {
    $version: '0.0.1',
    $name: config.versionName,
    $modifiedAt: '',
    ...getToolProfile(config, tool),
  } as ToolProfile<T>
}

/** @legacy */
export function convertToConfigLegacy<T extends Tool>(
  walletAddress: string,
  profile: ToolProfile<T>,
): Partial<ElementConfigType> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { $name, $version, $modifiedAt, ...rest } = profile
  if ('thumbnail' in profile) {
    return {
      bannerFontName: profile.font.name,
      bannerTitleText: profile.title.text,
      bannerDescriptionText: profile.description.text,
      bannerDescriptionVisible: profile.description.isVisible,
      bannerSlideAnimation: profile.animation.type,
      bannerPosition: profile.position,
      bannerBorder: profile.border.type,
      bannerTextColor: profile.color.text,
      bannerBackgroundColor: profile.color.background as string,
      bannerThumbnail: profile.thumbnail.value,
      ...getLegacyFontSize(profile),
    }
  }
  return {
    walletAddress,
    versionName: $name,
    ...rest,
    ...getLegacyFontSize(profile),
  }
}

/** @legacy */
// TODO: to be removed after the completion of versioned configurations
export function convertToConfigsLegacy<T extends Tool>(
  walletAddress: string,
  profiles: ToolProfiles<T>,
) {
  const configs: Record<string, Partial<ElementConfigType>> = {}

  Object.entries(profiles ?? {}).forEach(([profileId, profile]) => {
    configs[profileId] = convertToConfigLegacy<T>(walletAddress, profile)
  })

  return configs
}

// TODO: to be removed after the completion of versioned configurations
export function convertToProfiles<T extends Tool>(
  configuration: ConfigVersions,
  _: T,
): ToolProfiles<T> {
  const profiles: Record<string, ToolProfile<T>> = {}

  Object.entries(configuration).forEach(([profileId, config]) => {
    profiles[profileId as ProfileId] = convertToProfile(config, _)
  })

  return profiles
}

export function convertToConfiguration<T extends Tool>(
  configuration: ConfigVersions,
  tool: T,
  walletAddress: string,
): Configuration {
  return {
    $walletAddress: walletAddress,
    $createdAt: '',
    $modifiedAt: '',
    [tool]: convertToProfiles<T>(configuration, tool),
  }
}

/** @legacy */
function getLegacyFontSize(profile: ToolProfile<Tool>) {
  if ('thumbnail' in profile) {
    return { bannerFontSize: bannerFontSizeToNumber(profile.font.size) }
  }
  if ('icon' in profile) {
    return { widgetFontSize: widgetFontSizeToNumber(profile.font.size) }
  }

  return {}
}

/** @legacy */
function getToolProfile(profile: ElementConfigType, tool: Tool) {
  if (tool === 'banner') {
    return {
      title: {
        text: profile.bannerTitleText,
      },
      description: {
        text: profile.bannerDescriptionText,
        isVisible: profile.bannerDescriptionVisible,
      },
      font: {
        name: profile.bannerFontName,
        size: numberToBannerFontSize(profile.bannerFontSize),
      },
      animation: {
        type: profile.bannerSlideAnimation,
      },
      position: profile.bannerPosition,
      border: {
        type: profile.bannerBorder,
      },
      color: {
        text: profile.bannerTextColor,
        background: profile.bannerBackgroundColor,
      },
      thumbnail: {
        value: profile.bannerThumbnail,
      },
    } satisfies Omit<ToolProfile<'banner'>, keyof BaseToolProfile>
  }
  if (tool === 'widget') {
    return {
      title: {
        text: profile.widgetTitleText,
      },
      description: {
        text: profile.widgetDescriptionText,
        isVisible: profile.widgetDescriptionVisible,
      },
      font: {
        name: profile.widgetFontName,
        size: numberToWidgetFontSize(profile.widgetFontSize),
      },
      position: profile.widgetPosition,
      border: {
        type: profile.widgetButtonBorder,
      },
      color: {
        text: profile.widgetTextColor,
        background: profile.widgetBackgroundColor,
        theme: profile.widgetBackgroundColor,
      },
      ctaPayButton: {
        text: profile.widgetButtonText,
      },
      icon: {
        value: '',
        color: profile.widgetTriggerBackgroundColor,
      },
    } satisfies Omit<ToolProfile<'widget'>, keyof BaseToolProfile>
  }

  throw new Error(`Unsupported tool type: ${tool}`)
}
