import { HTTPException } from 'hono/http-exception'
import z from 'zod'
import { zValidator } from '@hono/zod-validator'
import { app } from '../../app'
import { PaymentIdSchema } from '../../schemas/payment'
import { OpenPaymentsService } from '../../utils/open-payments'
import { getData, setData, type PaymentKvData } from '../../utils/payments-kv'
import { createHTTPException } from '../../utils/utils'

const _PaymentStatusParamSchema = z.object({
  paymentId: z
    .string()
    .min(1, 'Payment ID is required')
    .max(100, 'Payment ID invalid'),
})
export type PaymentStatusParam = z.infer<typeof _PaymentStatusParamSchema>

app.get(
  '/payment/status/:paymentId',
  zValidator('param', z.object({ paymentId: PaymentIdSchema })),
  async ({ req, json, env }) => {
    const { paymentId } = req.param()

    try {
      const status = await getData(env.PUBLISHER_TOOLS_KV, paymentId)
      return await handleStatus(status)
    } catch (error) {
      if (error instanceof HTTPException) throw error
      throw createHTTPException(404, 'Failed to retrieve data', error)
    }

    async function handleStatus(data: PaymentKvData | null) {
      if (!data) {
        throw createHTTPException(404, 'Payment not found', {
          message: 'The payment is either already complete, or never existed.',
        })
      }

      if (data.status === 'PENDING') {
        // The user hasn't accepted the grant yet
        return json({ type: 'PENDING_GRANT_INTERACTION' })
      }

      if (data.status === 'GRANT_REJECTED') {
        // The user rejected the grant
        return json({ type: 'GRANT_REJECTED' })
      }

      if (data.status === 'CREATED') {
        // We created the payment, but amount not sent yet.
        const openPayments = await OpenPaymentsService.getInstance(env)
        const result = await openPayments.completePaymentProcess(
          undefined,
          undefined,
          data.outgoingPaymentId,
          data.outgoingPaymentGrantAccessToken,
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
        return json({
          type: 'OUTGOING_PAYMENT_CREATED',
          outgoingPaymentId: data.outgoingPaymentId,
        })
      }

      if (data.status === 'COMPLETE') {
        // Should stop polling at this stage. The KV entry will expire soon.
        return json({
          type: 'OUTGOING_PAYMENT_DONE',
          result: data.result,
          ...(data.error && {
            error: {
              code: data.error?.code,
              message: data.error?.message,
            },
          }),
        })
      }
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
