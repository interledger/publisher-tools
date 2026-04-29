import z from 'zod'
import { zValidator } from '@hono/zod-validator'
import { app } from '../../app'
import { OpenPaymentsService } from '../../utils/open-payments'
import { getData, setData } from '../../utils/payments-kv'
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

        const status = await getData(env.PUBLISHER_TOOLS_KV, paymentId)
        if (!status) {
          throw createHTTPException(404, 'Payment not found', {
            message: `The payment is either already complete, or never existed.`,
          })
        }
        if (status.status === 'PENDING') {
          // The user hasn't accepted the grant yet
          return json({ type: 'PENDING_GRANT_INTERACTION', ...status })
        }
        if (status.status === 'CREATED') {
          // We created the payment, but amount not sent yet.
          const openPayments = await OpenPaymentsService.getInstance(env)
          const result = await openPayments.completePaymentProcess(
            undefined,
            undefined,
            status.outgoingPaymentId,
            status.outgoingPaymentGrantAccessToken,
          )
          await setData(
            env.PUBLISHER_TOOLS_KV,
            paymentId,
            {
              status: 'COMPLETE',
              result: result.success ? 'success' : 'failure',
              error: result.success ? undefined : result.error,
            },
            { expirationTtl: 3 * 60 /* 3 minutes */ },
          )
          return json({ type: 'OUTGOING_PAYMENT_CREATED', ...status })
        }
        if (status.status === 'COMPLETE') {
          // Should stop polling at this stage. The KV entry will expire soon.
          return json({ type: 'OUTGOING_PAYMENT_DONE', ...status })
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
