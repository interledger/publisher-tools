import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import { ZodError } from 'zod'
import { ConfigStorageService } from '@shared/config-storage-service'
import { APP_URL, AWS_PREFIX } from '@shared/defines'
import type { ConfigVersions } from '@shared/types'
import * as probabilisticRevShare from './routes/probabilistic-revshare.js'
import { OpenPaymentsService } from './utils/open-payments.js'
import {
  PaymentQuoteSchema,
  PaymentGrantSchema,
  PaymentFinalizeSchema,
  WalletAddressParamSchema
} from './schemas/payment.js'
import { createHTTPException, serializeError } from './utils/utils.js'

export type Env = {
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
  AWS_REGION: string
  AWS_BUCKET_NAME: string
  OP_WALLET_ADDRESS: string
  OP_PRIVATE_KEY: string
  OP_KEY_ID: string
}

const app = new Hono<{ Bindings: Env }>()

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    maxAge: 7200
  })
)

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    console.error(error)
    const err = {
      status: error.status,
      statusText: error.res?.statusText,
      message: error.message,
      details: {
        // @ts-expect-error if there's a cause, it should have a message
        message: error.cause?.message
      }
    }
    return c.json({ error: err }, error.status)
  }

  if (error instanceof ZodError) {
    const err = {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: {
        issues: error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }
    }
    return c.json({ error: err }, 400)
  }

  const serializedError = serializeError(error)
  console.error('Unexpected error: ', serializedError)
  const err = {
    message: 'INTERNAL_ERROR',
    ...serializedError
  }

  return c.json({ error: err }, 500)
})

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

app.get(
  '/revshare/:payload',
  zValidator('param', probabilisticRevShare.paramSchema),
  async ({ req, json }) => {
    const encodedPayload = req.param('payload')
    try {
      const result = await probabilisticRevShare.handler(encodedPayload)
      return json(result)
    } catch (error) {
      if (error instanceof HTTPException) throw error
      throw createHTTPException(500, 'Revenue share error', error)
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
