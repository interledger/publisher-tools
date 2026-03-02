import { HTTPException } from 'hono/http-exception'
import z from 'zod'
import { zValidator } from '@hono/zod-validator'
import {
  ConfigStorageService,
  ConfigStorageServiceError,
  isConfigStorageNotFoundError,
} from '@shared/config-storage-service'
import { getDefaultProfile } from '@shared/default-data'
import { AWS_PREFIX } from '@shared/defines'
import {
  numberToBannerFontSize,
  numberToWidgetFontSize,
  PROFILE_IDS,
  TOOLS,
} from '@shared/types'
import type {
  BaseToolProfile,
  ConfigVersions,
  ElementConfigType,
  Tool,
  ToolProfile,
} from '@shared/types'
import { app } from '../app.js'
import { createHTTPException } from '../utils/utils.js'

app.get(
  '/profile/:tool',
  zValidator(
    'param',
    z.object({
      tool: z.enum(TOOLS),
    }),
  ),
  zValidator(
    'query',
    z.object({
      wa: z.url(),
      id: z.enum(PROFILE_IDS),
    }),
  ),
  async ({ req, json, env }) => {
    const { tool } = req.valid('param')
    const { wa: walletAddress, id: profileId } = req.valid('query')

    const storage = new ConfigStorageService({ ...env, AWS_PREFIX })

    try {
      const fullConfig = await storage.getJson<ConfigVersions>(walletAddress)
      const legacyProfile = fullConfig[profileId]
      const profile = convertToProfile(legacyProfile, tool)
      if (!profile)
        throw new ConfigStorageServiceError(
          'not-found',
          404,
          `No profile found for tool profile ${profileId}`,
        )

      return json(profile)
    } catch (error) {
      if (error instanceof HTTPException) throw error
      if (isConfigStorageNotFoundError(error)) {
        return json(getDefaultProfile(tool), 404)
      }

      throw createHTTPException(500, 'Config fetch error: ', error)
    }
  },
)

// TODO: to be removed after the completion of versioned configurations
function convertToProfile<T extends Tool>(
  config: ElementConfigType,
  tool: T,
): ToolProfile<T> | undefined {
  // means there is no profile for the given tool/profileId
  if (!config) return

  if (tool === 'offerwall') {
    return config.offerwall as ToolProfile<T>
  }

  return {
    $version: '0.0.1',
    $name: config.versionName,
    $modifiedAt: '',
    ...getToolProfile(config, tool),
  } as ToolProfile<T>
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
        theme: profile.widgetButtonBackgroundColor,
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
