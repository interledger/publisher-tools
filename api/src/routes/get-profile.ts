import { HTTPException } from 'hono/http-exception'
import z from 'zod'
import { zValidator } from '@hono/zod-validator'
import { ConfigStorageService } from '@shared/config-storage-service'
import { AWS_PREFIX } from '@shared/defines'
import { PROFILE_IDS, TOOLS } from '@shared/types'
import type {
  BannerConfig,
  ConfigVersions,
  ElementConfigType,
  ProfileId,
  Tool,
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
      const fullConfig = await storage.getJson<ConfigVersions>(walletAddress)
      const profile = getToolProfile(fullConfig, tool, profileId)
      return json(profile)
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

function getToolProfile(
  config: ConfigVersions,
  tool: Tool,
  profileId: ProfileId,
) {
  const profile = config[profileId]
  if (!profile) {
    throw createHTTPException(404, 'Profile not found for given id', {
      message: `Use one of ${JSON.stringify(Object.keys(config))}`,
    })
  }

  switch (tool) {
    case 'widget':
      return extract<WidgetConfig>(
        profile,
        (key) => key.startsWith('widget') || key.includes('Widget'),
      )
    case 'banner':
      return extract<BannerConfig>(
        profile,
        (key) => key.startsWith('banner') || key.includes('Banner'),
      )
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
