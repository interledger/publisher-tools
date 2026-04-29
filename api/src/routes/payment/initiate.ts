import z from 'zod'
import { zValidator } from '@hono/zod-validator'
import { createId } from '@paralleldrive/cuid2'
import { app } from '../../app'
import {
  DebitOrReceiveAmountSchema,
  WalletAddressSchema,
} from '../../schemas/payment'
import { OpenPaymentsService } from '../../utils/open-payments'
import { setData } from '../../utils/payments-kv'
import { createHTTPException } from '../../utils/utils'

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

app.post(
  '/payment/initiate',
  zValidator('json', PaymentInitiateSchema),
  async ({ req, json, env }) => {
    try {
      const params = req.valid('json')
      const paymentId = createId()
      const originalRedirectUrl = params.redirectUrl
      params.redirectUrl = new URL(
        `/payment/complete/${paymentId}`,
        req.url,
      ).href

      const openPayments = await OpenPaymentsService.getInstance(env)
      const { grantContinuation, ...result } =
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
          redirectUrl: originalRedirectUrl,
          grantContinuation: grantContinuation,
          sender: params.sender,
        },
        { expirationTtl: 10 * 60 /* 10 minutes */ },
      )
      return json(result)
    } catch (error) {
      console.error(error)
      throw createHTTPException(500, 'Payment initiate error: ', error)
    }
  },
)
