import { zValidator } from '@hono/zod-validator'
import { ConfigStorageService } from '@shared/config-storage-service'
import { APP_URL, AWS_PREFIX } from '@shared/defines'
import type { ConfigVersions } from '@shared/types'
import { OpenPaymentsService } from './utils/open-payments.js'
import {
  PaymentQuoteSchema,
  PaymentGrantSchema,
  PaymentFinalizeSchema,
  WalletAddressParamSchema
} from './schemas/payment.js'
import { createHTTPException } from './utils/utils.js'
import { app } from './app.js'

import './routes/probabilistic-revshare.js'

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

app.post(
  '/payment/quote',
  zValidator('json', PaymentQuoteSchema),
  async ({ req, json, env }) => {
    try {
      const { senderWalletAddress, receiverWalletAddress, amount, note } =
        req.valid('json')

      const openPayments = await OpenPaymentsService.getInstance(env)
      const result = await openPayments.createPayment({
        senderWalletAddress,
        receiverWalletAddress,
        amount,
        note
      })

      return json(result)
    } catch (error) {
      throw createHTTPException(500, 'Payment quote creation error: ', error)
    }
  }
)

app.post(
  '/payment/grant',
  zValidator('json', PaymentGrantSchema),
  async ({ req, json, env }) => {
    try {
      const { walletAddress, debitAmount, receiveAmount, redirectUrl } =
        req.valid('json')
      if (!isAllowedRedirectUrl(redirectUrl)) {
        throw createHTTPException(400, 'Invalid redirect URL', {})
      }

      const openPayments = await OpenPaymentsService.getInstance(env)
      const result = await openPayments.initializePayment({
        walletAddress,
        debitAmount,
        receiveAmount,
        redirectUrl
      })

      return json(result)
    } catch (error) {
      throw createHTTPException(500, 'Payment grant creation error: ', error)
    }
  }
)

app.post(
  '/payment/finalize',
  zValidator('json', PaymentFinalizeSchema),
  async ({ req, json, env }) => {
    try {
      const {
        walletAddress,
        pendingGrant,
        quote,
        incomingPaymentGrant,
        interactRef,
        note
      } = req.valid('json')

      const openPaymentsService = await OpenPaymentsService.getInstance(env)
      const result = await openPaymentsService.finishPaymentProcess(
        walletAddress,
        pendingGrant,
        quote,
        incomingPaymentGrant,
        interactRef,
        note
      )

      return json(result)
    } catch (error) {
      throw createHTTPException(500, 'Payment finalization error: ', error)
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

function isAllowedRedirectUrl(redirectUrl: string) {
  const redirectUrlOrigin = new URL(redirectUrl).origin
  const ALLOWED_ORIGINS = Object.values(APP_URL)
  return ALLOWED_ORIGINS.some((origin) => redirectUrlOrigin === origin)
}
