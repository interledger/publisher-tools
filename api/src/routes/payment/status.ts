import z from 'zod'
import { zValidator } from '@hono/zod-validator'
import { KV_PAYMENTS_PREFIX } from '@shared/types'
import { app } from '../../app'
import { createHTTPException, waitWithAbort } from '../../utils/utils'

const PaymentStatusParamSchema = z.object({
  paymentId: z
    .string()
    .min(1, 'Payment ID is required')
    .max(100, 'Payment ID invalid'),
})
export type PaymentStatusParam = z.infer<typeof PaymentStatusParamSchema>

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
          'json',
        )

        if (status) {
          return json({
            type: 'GRANT_INTERACTION',
            ...status,
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
  },
)

export type PaymentStatusSuccess = {
  paymentId: string
  hash: string
  interact_ref: string
}

export type PaymentStatusRejected = {
  paymentId: string
  result: 'grant_rejected'
}

export type PaymentStatus = PaymentStatusSuccess | PaymentStatusRejected
