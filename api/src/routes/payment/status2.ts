import { HTTPException } from 'hono/http-exception'
import z from 'zod'
import { zValidator } from '@hono/zod-validator'
import { app, type Env } from '../../app'
import { PaymentIdSchema } from '../../schemas/payment'
import { OpenPaymentsService } from '../../utils/open-payments'
import { getData, setData, type PaymentKvData } from '../../utils/payments-kv'
import { createHTTPException } from '../../utils/utils'

app.get(
  '/payment/status/:paymentId',
  zValidator('param', z.object({ paymentId: PaymentIdSchema })),
  async ({ req, json, env }) => {
    const { paymentId } = req.param()

    try {
      const status = await getData(env.PUBLISHER_TOOLS_KV, paymentId)
      const result = await handleStatus(status, paymentId, env)
      return json(result)
    } catch (error) {
      if (error instanceof HTTPException) throw error
      throw createHTTPException(404, 'Failed to retrieve data', error)
    }
  },
)

async function handleStatus(
  data: PaymentKvData | null,
  paymentId: string,
  env: Env,
): Promise<PaymentStatus> {
  if (!data) {
    throw createHTTPException(404, 'Payment not found', {
      message: 'The payment is either already complete, or never existed.',
    })
  }

  // The user hasn't accepted the grant yet
  if (data.status === 'PENDING') {
    return { type: 'PENDING_GRANT_INTERACTION' }
  }

  // The user rejected the grant
  if (data.status === 'GRANT_REJECTED') {
    return { type: 'GRANT_REJECTED' }
  }

  // We created the payment, but amount not sent yet.
  if (data.status === 'CREATED') {
    const openPayments = await OpenPaymentsService.getInstance(env)
    const result = await openPayments.pollOutgoingPayment(
      data.outgoingPaymentId,
      data.outgoingPaymentGrantAccessToken,
    )
    await setData(
      env.PUBLISHER_TOOLS_KV,
      paymentId,
      {
        status: 'COMPLETE',
        outgoingPaymentId: data.outgoingPaymentId,
        result: result.success ? 'success' : 'failure',
        error: result.success ? undefined : result.error,
      },
      { expirationTtl: 3 * 60 /* 3 minutes */ },
    )
    return {
      type: 'OUTGOING_PAYMENT_CREATED',
      outgoingPaymentId: data.outgoingPaymentId,
    }
  }

  // Should stop polling at this stage. The KV entry will expire soon.
  if (data.status === 'COMPLETE') {
    return {
      type: 'OUTGOING_PAYMENT_DONE',
      outgoingPaymentId: data.outgoingPaymentId,
      result: data.result,
      ...(data.error && {
        error: {
          code: data.error?.code,
          message: data.error?.message,
        },
      }),
    }
  }

  throw createHTTPException(
    500,
    // @ts-expect-error this should never happen
    `Unexpected payment status: ${data.status}.`,
    {},
  )
}

export type PaymentStatus =
  | { type: 'PENDING_GRANT_INTERACTION' }
  | { type: 'GRANT_REJECTED' }
  | { type: 'OUTGOING_PAYMENT_CREATED'; outgoingPaymentId: string }
  | {
      type: 'OUTGOING_PAYMENT_DONE'
      outgoingPaymentId: string
      result: 'success' | 'failure'
      error?: { code: string; message: string }
    }
