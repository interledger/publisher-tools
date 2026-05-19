import { HTTPException } from 'hono/http-exception'
import z from 'zod'
import { createId } from '@paralleldrive/cuid2'
import { toAmount } from '@shared/utils'
import { app } from '../../app'
import {
  DebitOrReceiveAmountSchema,
  WalletAddressSchema,
} from '../../schemas/payment'
import { OpenPaymentsService } from '../../utils/open-payments'
import { setData } from '../../utils/payments-kv'
import { createHTTPException, validate } from '../../utils/utils'

const PaymentInitiateSchema = z
  .object({
    sender: WalletAddressSchema,
    receiver: WalletAddressSchema,
    note: z.string(),
    // Can be any website here
    redirectUrl: z.url(),
  })
  .and(DebitOrReceiveAmountSchema)
export type PaymentInitiateInput = z.infer<typeof PaymentInitiateSchema>

export type PaymentInitiateResult = {
  paymentId: string
  incomingPaymentId: string
  grantRedirectUrl: string
}

app.post(
  '/payment/initiate',
  validate('json', PaymentInitiateSchema),
  async ({ req, json, env }) => {
    try {
      const params = req.valid('json')
      const paymentId = createId()
      const originalRedirectUrl = params.redirectUrl
      params.redirectUrl = new URL(
        `/payment/redirect/${paymentId}`,
        req.url,
      ).href

      const openPayments = await OpenPaymentsService.getInstance(env)
      const { grantContinuation, nonce, incomingPaymentId, ...result } =
        await openPayments.paymentInitiate(params)

      // The `/payment/complete` endpoint will find details from the KV based on
      // `paymentId` (from the redirect URL), then create outgoing payment as
      // soon as grant is accepted based on data available in KV.
      await setData(
        env.PUBLISHER_TOOLS_KV,
        paymentId,
        {
          status: 'PENDING',
          quoteId: result.quoteId,
          incomingPaymentId,
          redirectUrl: originalRedirectUrl,
          grantContinuation: grantContinuation,
          sender: params.sender,
          receiver: params.receiver,
          amount: params.debitAmount
            ? toAmount(params.debitAmount, params.sender)
            : toAmount(params.receiveAmount!, params.receiver),
          metadata: { description: params.note },
          nonce,
        },
        { expirationTtl: 10 * 60 /* 10 minutes */ },
      )
      return json({
        paymentId: paymentId,
        incomingPaymentId,
        grantRedirectUrl: result.grantRedirectUrl,
      } satisfies PaymentInitiateResult)
    } catch (error) {
      console.error(error)
      if (error instanceof HTTPException) throw error
      throw createHTTPException(500, 'Payment initiate error: ', error)
    }
  },
)
