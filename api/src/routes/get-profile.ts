import { HTTPException } from 'hono/http-exception'
import z from 'zod'
import { zValidator } from '@hono/zod-validator'
import { ConfigStorageService } from '@shared/config-storage-service'
import { AWS_PREFIX } from '@shared/defines'
import {
  numberToBannerFontSize,
  numberToWidgetFontSize,
  PROFILE_IDS,
  TOOLS,
} from '@shared/types'
import type {
  BaseToolProfile,
  Configuration,
  ConfigVersions,
  ElementConfigType,
  Tool,
  ToolProfile,
  WidgetConfig,
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
      let profile: ToolProfile<typeof tool> | null = null
      try {
        const config = await storage.getJson<Configuration>(walletAddress)
        profile = config[tool]?.[profileId] ?? null
      } catch (e) {
        const err = e as Error
        if (err.name !== 'NoSuchKey' && !err.message.includes('404')) {
          throw e
        }
        // TODO: to be removed after the completion of versioned config migration
        const legacy =
          await storage.getLegacyJson<ConfigVersions>(walletAddress)
        profile = convertToProfile(legacy[profileId], tool)
      }

      if (profile === null) {
        const msg = 'No saved profile found for given wallet address'
        throw createHTTPException(404, msg, {
          message: 'Not found',
          code: '404',
        })
      }

      return json<ToolProfile<typeof tool>>(profile)
    } catch (error) {
      if (error instanceof HTTPException) throw error
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          const msg = 'No saved profile found for given wallet address'
          throw createHTTPException(404, msg, {
            message: 'Not found', // can include the S3 key here perhaps
            code: '404',
          })
        }
      }
      throw createHTTPException(500, 'Config fetch error: ', error)
    }
  },
)

// TODO: to be removed after the completion of versioned configurations
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
  return {
    ...extract<WidgetConfig>(
      profile,
      (key) => key.startsWith('widget') || key.includes('Widget'),
    ),
    widgetFontSize: numberToWidgetFontSize(profile.widgetFontSize),
  }
}

function extract<R, T = ElementConfigType, K = keyof T>(
  obj: T,
  filter: (key: K) => boolean,
): R {
  const entries = Object.entries(obj as Record<string, unknown>).filter(
    ([key]) => filter(key as K),
  )
  if (!entries.length) {
    throw new Error('No matching profile found')
  }
  return Object.fromEntries(entries) as R
}
