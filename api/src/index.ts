import { app } from './app.js'

import './routes/get-profile.js'
import './routes/probabilistic-revshare.js'
import './routes/payment.js'
import './routes/wallet.js'

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
