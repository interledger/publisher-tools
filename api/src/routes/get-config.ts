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
  WidgetConfig
} from '@shared/types'
import { app } from '../app.js'
import { createHTTPException } from '../utils/utils.js'

app.get(
  '/config/:tool',
  zValidator(
    'param',
    z.object({
      tool: z.enum(TOOLS)
    })
  ),
  zValidator(
    'query',
    z.object({
      wa: z.url(),
      profile: z.enum(PROFILE_IDS)
    })
  ),
  async ({ req, json, env }) => {
    const { tool } = req.valid('param')
    const { wa: walletAddress, profile: profileId } = req.valid('query')

    const storage = new ConfigStorageService({ ...env, AWS_PREFIX })

    try {
      const fullConfig = await storage.getJson<ConfigVersions>(walletAddress)
      const config = getToolConfig(fullConfig, tool, profileId)
      return json(config)
    } catch (error) {
      if (error instanceof HTTPException) throw error
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          const msg = 'No saved config found for given wallet address'
          throw createHTTPException(404, msg, {
            message: 'Not found', // can include the S3 key here perhaps
            code: '404'
          })
        }
      }
      throw createHTTPException(500, 'Config fetch error: ', error)
    }
  }
)

function getToolConfig(
  config: ConfigVersions,
  tool: Tool,
  profileId: ProfileId
) {
  const conf = config[profileId]
  if (!conf) {
    throw createHTTPException(404, 'Saved config not found for given profile', {
      message: `Use one of ${JSON.stringify(Object.keys(config))}`
    })
  }

  switch (tool) {
    case 'widget':
      return extract<WidgetConfig>(
        conf,
        (key) => key.startsWith('widget') || key.includes('Widget')
      )
    case 'banner':
      return extract<BannerConfig>(
        conf,
        (key) => key.startsWith('banner') || key.includes('Banner')
      )
  }
}

function extract<R, T = ElementConfigType, K = keyof T>(
  obj: T,
  filter: (key: K) => boolean
): R {
  const entries = Object.entries(obj as Record<string, unknown>).filter(
    ([key]) => filter(key as K)
  )
  if (!entries.length) {
    throw new Error('No matching config found')
  }
  return Object.fromEntries(entries) as R
}
