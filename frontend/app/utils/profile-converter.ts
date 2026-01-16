import type {
  ConfigVersions,
  ToolProfiles,
  ProfileId,
  Tool,
  ElementConfigType,
  Configuration,
  WidgetConfig,
  BannerConfig,
  ToolProfile
} from '@shared/types'
import type { StableKey } from '~/stores/toolStore'

function convertToProfile<T extends Tool>(
  config: ElementConfigType,
  tool: T
): ToolProfile<T> {
  return {
    $version: '0.0.1',
    $name: config.versionName,
    $modifiedAt: '',
    ...getToolProfile(config, tool)
  } as ToolProfile<T>
}

/** @legacy */
function convertToConfigLegacy<T extends Tool>(
  walletAddress: string,
  profile: ToolProfile<T>
): ElementConfigType {
  return {
    walletAddress,
    versionName: profile.$name,
    ...profile
  } as unknown as ElementConfigType
}

/** @legacy */
export function convertToConfigsLegacy<T extends Tool>(
  walletAddress: string,
  profiles: ToolProfiles<T>
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
  _: T
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
  walletAddress: string
): Configuration {
  return {
    $walletAddress: walletAddress,
    $createdAt: '',
    $modifiedAt: '',
    [tool]: convertToProfiles<T>(configuration, tool)
  }
}

/** @legacy */
function getToolProfile(profile: ElementConfigType, tool: Tool) {
  switch (tool) {
    case 'widget':
      return extract<WidgetConfig>(
        profile,
        (key) => key.startsWith('widget') || key.includes('Widget')
      )
    case 'banner':
      return extract<BannerConfig>(
        profile,
        (key) => key.startsWith('banner') || key.includes('Banner')
      )
  }
}

/** @legacy */
function extract<R, T = ElementConfigType, K = keyof T>(
  obj: T,
  filter: (key: K) => boolean
): R {
  const entries = Object.entries(obj as Record<string, unknown>).filter(
    ([key]) => filter(key as K)
  )
  if (!entries.length) {
    throw new Error('No matching profile found')
  }
  return Object.fromEntries(entries) as R
}
