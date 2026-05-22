import { AWS_PREFIX } from '@shared/defines'
import { app } from './app.js'

import './routes/get-profile.js'
import './routes/probabilistic-revshare.js'
import './routes/auth/index.js'
import './routes/payment/index.js'
import './routes/wallet.js'
import './routes/events.js'

app.get('/', (c) => {
  const routes = app.routes
    .filter((route) => route.method !== 'ALL')
    .map((route) => ({
      path: route.path,
      method: route.method,
    }))

  return c.json(
    {
      status: 'ok',
      message: 'Publisher Tools API',
      AWS_PREFIX,
      endpoints: routes,
      timestamp: new Date().toISOString(),
    },
    200,
  )
})

export default app
