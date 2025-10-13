import { zValidator } from '@hono/zod-validator'

import { APP_URL } from '@shared/defines'
import { createHTTPException } from '../utils/utils'
import { OpenPaymentsService } from '../utils/open-payments.js'
import {
  PaymentQuoteSchema,
  PaymentGrantSchema,
  PaymentFinalizeSchema
} from '../schemas/payment.js'

import { app } from '../app.js'

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

app.get('/payment/status/:paymentId', async ({ req, json, env }) => {
  const { paymentId } = req.param()
  if (!paymentId) {
    throw createHTTPException(400, 'Payment ID required', {})
  }

  const POLLING_MAX_DURATION = 30000
  const POLLING_INTERVAL = 1500
  const signal = AbortSignal.timeout(POLLING_MAX_DURATION)

  try {
    while (!signal.aborted) {
      const data = await env.PUBLISHER_TOOLS_KV.get(paymentId)

      if (data) {
        const parsedData = JSON.parse(data)
        const params_obj: { [key: string]: string } = {}
        new URLSearchParams(parsedData).forEach((value, key) => {
          params_obj[key] = value
        })

        if (params_obj.result === 'grant_rejected') {
          throw createHTTPException(403, 'Payment grant was rejected', {
            paymentId,
            result: 'grant_rejected'
          })
        }

        return json({
          success: true,
          data: { type: 'GRANT_INTERACTION', ...params_obj }
        })
      }

      await waitWithAbort(POLLING_INTERVAL, signal)
    }

    throw new Error('AbortError')
  } catch (error) {
    if (error instanceof Error && error.message === 'TimeoutError') {
      throw createHTTPException(504, 'Payment status polling timeout', {})
    }

    throw createHTTPException(500, 'Failed to retrieve data', error)
  }
})

function waitWithAbort(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('TimeoutError'))
      return
    }

    const timer = setTimeout(() => {
      resolve()
    }, ms)

    const onAbort = () => {
      clearTimeout(timer)
      reject(new Error('TimeoutError'))
    }

    signal.addEventListener('abort', onAbort, { once: true })
  })
}

function isAllowedRedirectUrl(redirectUrl: string) {
  const redirectUrlOrigin = new URL(redirectUrl).origin
  const ALLOWED_ORIGINS = Object.values(APP_URL)
  return ALLOWED_ORIGINS.some((origin) => redirectUrlOrigin === origin)
}
