import { HTTPException } from 'hono/http-exception'
import z from 'zod'
import { isEqualAmount } from '@shared/utils'
import { app, type Env } from '../../app'
import { PaymentIdSchema } from '../../schemas/payment'
import { OpenPaymentsService } from '../../utils/open-payments'
import { getPayment, setPaymentStatus } from '../../utils/payments-db'
import { getData, setData, type PaymentKvData } from '../../utils/payments-kv'
import { createHTTPException, validate } from '../../utils/utils'

app.get(
  '/paywall/status/:paymentId',
  validate('param', z.object({ paymentId: PaymentIdSchema })),
  async ({ req, json, env }) => {
    const { paymentId } = req.valid('param')

    try {
      const status = await getData(env.PUBLISHER_TOOLS_KV, paymentId)
      const result = status
        ? await handleStatus(status, paymentId, env)
        : await handleNoStatus(paymentId, env)
      return json(result)
    } catch (error) {
      if (error instanceof HTTPException) throw error
      throw createHTTPException(404, 'Failed to retrieve data', error)
    }
  },
)

async function handleStatus(
  data: PaymentKvData,
  paymentId: string,
  env: Env,
): Promise<PaywallPaymentStatus> {
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
        incomingPaymentId: data.incomingPaymentId,
        outgoingPaymentId: data.outgoingPaymentId,
        sender: data.sender,
        receiver: data.receiver,
        amount: data.amount,
        result: result.success ? 'success' : 'failure',
        error: result.success ? undefined : result.error,
      },
      { expirationTtl: 3 * 60 /* 3 minutes */ },
    )
    if (!result.success) {
      if (result.error.code !== 'OUTGOING_PAYMENT_INCOMPLETE') {
        await setPaymentStatus(env.PUBLISHER_TOOLS_DB, paymentId, 'failed')
      } else {
        // we can try check again later, but can delete (mark as failed) if
        // payment is too old and not complete
      }
    }
    return {
      type: 'PAYMENT_CREATED',
      outgoingPaymentId: data.outgoingPaymentId,
    }
  }

  // Should stop polling at this stage. The KV entry will expire soon.
  if (data.status === 'COMPLETE') {
    await setPaymentStatus(env.PUBLISHER_TOOLS_DB, paymentId, 'complete')
    return {
      type: 'PAYMENT_DONE',
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

async function handleNoStatus(
  paymentId: string,
  env: Env,
): Promise<PaywallPaymentStatus> {
  const row = await getPayment(env.PUBLISHER_TOOLS_DB, paymentId)
  if (row?.status === 'complete') {
    const { outgoingPaymentId } = row
    return { type: 'PAYMENT_DONE', outgoingPaymentId, result: 'success' }
  }

  if (!row || isBeforeNowBy(row.ts, 5 * 24 * 60 * 60 * 1000)) {
    // Don't find status of too old payments, to avoid enumeration risks.
    throw createHTTPException(404, 'Payment not found', {
      message: 'The payment is either already complete, or never existed.',
    })
  }
  const { incomingPaymentId, outgoingPaymentId, amount } = row

  const op = await OpenPaymentsService.getInstance(env)
  const incomingPayment = await op.getIncomingPayment(incomingPaymentId)
  const completed = incomingPayment.receivedAmount
    ? isEqualAmount(incomingPayment.receivedAmount, amount)
    : false
  if (completed) {
    await setPaymentStatus(env.PUBLISHER_TOOLS_DB, paymentId, 'complete')
    return { type: 'PAYMENT_DONE', result: 'success', outgoingPaymentId }
  }

  if ('expiresAt' in incomingPayment && incomingPayment.expiresAt) {
    if (isBeforeNowBy(new Date(incomingPayment.expiresAt), 0)) {
      await setPaymentStatus(env.PUBLISHER_TOOLS_DB, paymentId, 'failed')
      return {
        type: 'PAYMENT_DONE',
        outgoingPaymentId,
        result: 'failure',
        error: {
          message: 'Incoming payment expired, but not complete',
          code: 'INCOMING_PAYMENT_EXPIRED',
        },
      }
    }
  }

  return { type: 'PAYMENT_CREATED', outgoingPaymentId }
}

function isBeforeNowBy(ts: Date, offsetMs: number) {
  return Date.now() - ts.valueOf() > offsetMs
}

export type PaywallPaymentStatus =
  | { type: 'PENDING_GRANT_INTERACTION' }
  | { type: 'GRANT_REJECTED' }
  | { type: 'PAYMENT_CREATED'; outgoingPaymentId: string }
  | {
      type: 'PAYMENT_DONE'
      outgoingPaymentId: string
      result: 'success' | 'failure'
      error?: { code: string; message: string }
    }
