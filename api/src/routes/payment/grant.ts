import z from 'zod'
import { zValidator } from '@hono/zod-validator'
import { APP_URL } from '@shared/defines'
import { app } from '../../app'
import { AmountSchema, WalletAddressSchema } from '../../schemas/payment'
import { OpenPaymentsService } from '../../utils/open-payments'
import { createHTTPException } from '../../utils/utils'

const PaymentGrantSchema = z.object({
  redirectUrl: z.url(),
  walletAddress: WalletAddressSchema,
  incomingPaymentId: z.url(),
  debitAmount: AmountSchema,
  receiveAmount: AmountSchema,
})
export type PaymentGrantInput = z.infer<typeof PaymentGrantSchema>

app.post(
  '/payment/grant',
  zValidator('json', PaymentGrantSchema),
  async ({ req, json, env }) => {
    try {
      const {
        walletAddress,
        incomingPaymentId,
        debitAmount,
        receiveAmount,
        redirectUrl,
      } = req.valid('json')
      if (!isAllowedRedirectUrl(redirectUrl)) {
        throw createHTTPException(400, 'Invalid redirect URL', {})
      }

      const openPayments = await OpenPaymentsService.getInstance(env)
      const result = await openPayments.initializePayment({
        walletAddress,
        incomingPaymentId,
        debitAmount,
        receiveAmount,
        redirectUrl,
      })

      return json(result)
    } catch (error) {
      throw createHTTPException(500, 'Payment grant creation error: ', error)
    }
  },
)

function isAllowedRedirectUrl(redirectUrl: string) {
  const redirectUrlOrigin = new URL(redirectUrl).origin
  const ALLOWED_ORIGINS = Object.values(APP_URL)
  return ALLOWED_ORIGINS.some((origin) => redirectUrlOrigin === origin)
}
