import { zValidator } from '@hono/zod-validator'
import { APP_URL } from '@shared/defines'
import { createHTTPException, waitWithAbort } from '../utils/utils'
import { OpenPaymentsService } from '../utils/open-payments.js'
import {
  PaymentQuoteSchema,
  PaymentGrantSchema,
  PaymentFinalizeSchema,
  PaymentStatusParamSchema
} from '../schemas/payment.js'
import { KV_PAYMENTS_PREFIX } from '@shared/types'
import type { PaymentStatus } from '../types'
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

app.get(
  '/payment/status/:paymentId',
  zValidator('param', PaymentStatusParamSchema),
  async ({ req, json, env }) => {
    const { paymentId } = req.param()

    const POLLING_MAX_DURATION = 25000
    const POLLING_INTERVAL = 1500
    const signal = AbortSignal.timeout(POLLING_MAX_DURATION)

    try {
      while (!signal.aborted) {
        await waitWithAbort(POLLING_INTERVAL, signal)

        const status = await env.PUBLISHER_TOOLS_KV.get<PaymentStatus>(
          KV_PAYMENTS_PREFIX + paymentId,
          'json'
        )

        if (status) {
          return json({
            type: 'GRANT_INTERACTION',
            ...status
          })
        }
      }

      throw new Error('AbortError')
    } catch (error) {
      if (error instanceof Error && error.message === 'TimeoutError') {
        throw createHTTPException(408, 'Payment status polling timeout', {})
      }

      throw createHTTPException(404, 'Failed to retrieve data', error)
    }
  }
)

function isAllowedRedirectUrl(redirectUrl: string) {
  const redirectUrlOrigin = new URL(redirectUrl).origin
  const ALLOWED_ORIGINS = Object.values(APP_URL)
  return ALLOWED_ORIGINS.some((origin) => redirectUrlOrigin === origin)
}
