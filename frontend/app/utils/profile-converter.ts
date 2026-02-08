import type {
  ConfigVersions,
  ToolProfiles,
  ProfileId,
  Tool,
  ElementConfigType,
  Configuration,
  WidgetConfig,
  BannerConfig,
  ToolProfile,
} from '@shared/types'
import {
  numberToBannerFontSize,
  numberToWidgetFontSize,
  bannerFontSizeToNumber,
  widgetFontSizeToNumber,
} from '@shared/types'
import type { StableKey } from '~/stores/toolStore'

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
): ElementConfigType {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { $name, $version, $modifiedAt, ...rest } = profile
  return {
    walletAddress,
    versionName: $name,
    ...rest,
    ...getLegacyFontSize(profile),
  } as unknown as ElementConfigType
}

/** @legacy */
export function convertToConfigsLegacy<T extends Tool>(
  walletAddress: string,
  profiles: ToolProfiles<T>,
): Record<StableKey, Partial<ElementConfigType>> {
  const configs: Record<string, ElementConfigType> = {}

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
  if ('bannerFontSize' in profile) {
    return { bannerFontSize: bannerFontSizeToNumber(profile.bannerFontSize) }
  }
  return { widgetFontSize: widgetFontSizeToNumber(profile.widgetFontSize) }
}

/** @legacy */
function getToolProfile(profile: ElementConfigType, tool: Tool) {
  if (tool === 'banner') {
    return {
      ...extract<BannerConfig>(
        profile,
        (key) => key.startsWith('banner') || key.includes('Banner'),
      ),
      bannerFontSize: numberToBannerFontSize(profile.bannerFontSize),
    }
  }
  return {
    ...extract<WidgetConfig>(
      profile,
      (key) => key.startsWith('widget') || key.includes('Widget'),
    ),
    widgetFontSize: numberToWidgetFontSize(profile.widgetFontSize),
  }
}

/** @legacy */
function extract<R, T = ElementConfigType, K = keyof T>(
  obj: T,
  filter: (key: K) => boolean,
): R {
  const entries = Object.entries(obj as Record<string, unknown>).filter(
    ([key]) => filter(key as K),
  )
  if (!entries.length) {
    return {} as R
  }
  return Object.fromEntries(entries) as R
}
