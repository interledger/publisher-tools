import { HTTPException } from 'hono/http-exception'
import z from 'zod'
import { urlWithParams } from '@shared/utils'
import { app } from '../../app'
import { PaymentIdSchema } from '../../schemas/payment'
import { OpenPaymentsService } from '../../utils/open-payments'
import { getData, setData } from '../../utils/payments-kv'
import { createHTTPException, validate } from '../../utils/utils'

export const PaymentStatusSuccessSchema = z.object({
  hash: z.string().min(1, 'Hash is required'),
  interact_ref: z.string().min(1, 'Interact reference is required'),
})
export const PaymentStatusRejectedSchema = z.object({
  result: z.literal('grant_rejected'),
})

export const PaymentStatusSchema = z.union([
  PaymentStatusSuccessSchema,
  PaymentStatusRejectedSchema,
])

export type PaymentStatusSuccess = z.infer<typeof PaymentStatusSuccessSchema>
export type PaymentStatusRejected = z.infer<typeof PaymentStatusRejectedSchema>

// This used to be in frontend/client earlier. It doesn't need to be. But we'll
// still have something (the `redirectUrl` provided in initiate) in frontend (to
// show to user). If someone else wants to use this PR (like from an embed with
// custom redirect) they can redirect to own endpoint with custom behavior.
//
// With this, the client doesn't need to trigger the payment manually - as soon
// as grant is accepted, outgoing-payment will be created.
app.get(
  '/payment/redirect/:paymentId',
  validate('param', z.object({ paymentId: PaymentIdSchema })),
  validate('query', PaymentStatusSchema),
  async ({ req, redirect, env }) => {
    try {
      const openPayments = await OpenPaymentsService.getInstance(env)
      const { paymentId } = req.valid('param')
      const queryParams = req.valid('query')

      const data = await getData(env.PUBLISHER_TOOLS_KV, paymentId)
      if (!data) {
        throw createHTTPException(404, 'Payment not found', {})
      }
      if (data.status !== 'PENDING') {
        throw createHTTPException(
          500,
          `Unexpected payment status: ${data.status}. Expected: PENDING`,
          {},
        )
      }

      if ('result' in queryParams && queryParams.result === 'grant_rejected') {
        await setData(
          env.PUBLISHER_TOOLS_KV,
          paymentId,
          { status: 'GRANT_REJECTED' },
          { expirationTtl: 5 * 60 /* 5 minutes */ },
        )
        return redirect(
          urlWithParams(data.redirectUrl, {
            paymentId,
            result: 'failure',
          }),
        )
      }

      if ('hash' in queryParams) {
        const { outgoingPaymentId, accessToken } =
          await openPayments.paymentComplete({
            quoteId: data.quoteId,
            grantContinuation: data.grantContinuation,
            sender: data.sender,
            metadata: data.metadata,
            nonce: data.nonce,
            interactRef: queryParams.interact_ref,
            hash: queryParams.hash,
          })
        await setData(
          env.PUBLISHER_TOOLS_KV,
          paymentId,
          {
            status: 'CREATED',
            redirectUrl: data.redirectUrl,
            outgoingPaymentId,
            sender: data.sender,
            outgoingPaymentGrantAccessToken: accessToken,
          },
          { expirationTtl: 5 * 60 /* 5 minutes */ },
        )
        return redirect(
          urlWithParams(data.redirectUrl, {
            paymentId,
            result: 'success',
          }),
        )
      }
    } catch (error) {
      console.error(error)
      if (error instanceof HTTPException) throw error
      throw createHTTPException(500, 'Payment continue error', error)
    }
  },
)
