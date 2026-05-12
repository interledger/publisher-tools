import { HTTPException } from 'hono/http-exception'
import z from 'zod'
import {
  ConfigStorageService,
  ConfigStorageServiceError,
  isConfigStorageNotFoundError,
} from '@shared/config-storage-service'
import { getDefaultProfile } from '@shared/default-data'
import { AWS_PREFIX } from '@shared/defines'
import { PROFILE_IDS, TOOLS } from '@shared/types'
import type { Configuration } from '@shared/types'
import { app } from '../app.js'
import { createHTTPException, validate } from '../utils/utils.js'

app.get(
  '/profile/:tool',
  validate(
    'param',
    z.object({
      tool: z.enum(TOOLS),
    }),
  ),
  validate(
    'query',
    z.object({
      wa: z.url(),
      id: z.enum(PROFILE_IDS),
    }),
  ),
  async ({ req, json, env }) => {
    const { tool } = req.valid('param')
    const { wa: walletAddress, id: profileId } = req.valid('query')

    if (tool === 'paywall') {
      return json(getDefaultProfile('paywall'))
    }

    const storage = new ConfigStorageService({ ...env, AWS_PREFIX })

    try {
      const config = await storage.getJson<Configuration>(walletAddress)
      const profile = config[tool]?.[profileId] ?? null

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
