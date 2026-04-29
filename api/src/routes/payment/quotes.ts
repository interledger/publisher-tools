import z from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { PaymentError } from '@shared/types'
import { app } from '../../app.js'
import {
  DebitOrReceiveAmountSchema,
  WalletAddressSchema,
} from '../../schemas/payment.js'
import {
  isNonPositiveAmountError,
  OpenPaymentsService,
} from '../../utils/open-payments.js'
import { createHTTPException } from '../../utils/utils.js'

const PaymentQuoteSchema = z
  .object({
    sender: WalletAddressSchema,
    receiver: WalletAddressSchema,
  })
  .and(DebitOrReceiveAmountSchema)

export type PaymentQuoteInput = z.infer<typeof PaymentQuoteSchema>

app.post(
  '/payment/quotes',
  zValidator('json', PaymentQuoteSchema),
  async ({ req, json, env }) => {
    try {
      const openPayments = await OpenPaymentsService.getInstance(env)
      const result = await openPayments.paymentQuote(req.valid('json'))
      return json(result)
    } catch (error) {
      if (isNonPositiveAmountError(error)) {
        return json(
          {
            error: 'NON_POSITIVE_AMOUNT' satisfies PaymentError,
            minSendAmount: error.details?.minSendAmount,
          },
          400,
        )
      }
      console.error(error)
      throw createHTTPException(500, 'Payment quote creation error: ', error)
    }
  },
)
