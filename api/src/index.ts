import { zValidator } from '@hono/zod-validator'
import { ConfigStorageService } from '@shared/config-storage-service'
import { AWS_PREFIX } from '@shared/defines'
import type { ConfigVersions } from '@shared/types'
import { WalletAddressParamSchema } from './schemas/payment.js'
import { createHTTPException } from './utils/utils.js'
import { app } from './app.js'

import './routes/probabilistic-revshare.js'
import './routes/payment.js'

app.get(
  '/config/:wa/:version?',
  zValidator('param', WalletAddressParamSchema),
  async ({ req, json, env }) => {
    const { wa, version } = req.valid('param')

    try {
      const storageService = new ConfigStorageService({ ...env, AWS_PREFIX })
      const config = await storageService.getJson<ConfigVersions>(wa)
      return json(config[version])
    } catch (error) {
      throw createHTTPException(500, 'Config fetch error: ', error)
    }
  }
)

app.get('/', (c) => {
  const routes = app.routes
    .filter((route) => route.method !== 'ALL')
    .map((route) => ({
      path: route.path,
      method: route.method
    }))

  return c.json(
    {
      status: 'ok',
      message: 'Publisher Tools API',
      endpoints: routes,
      timestamp: new Date().toISOString()
    },
    200
  )
})

export default app
