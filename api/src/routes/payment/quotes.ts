import z from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { PaymentError } from '@shared/types'
import { app } from '../../app.js'
import { UserAmountSchema, WalletAddressSchema } from '../../schemas/payment.js'
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
  .and(
    z.union(
      [
        z.object({
          debitAmount: UserAmountSchema,
          receiveAmount: z.never().optional(),
        }),
        z.object({
          receiveAmount: UserAmountSchema,
          debitAmount: z.never().optional(),
        }),
      ],
      {
        error:
          'Must provide either `debitAmount` or `receiveAmount`, but not both',
      },
    ),
  )

export type PaymentQuoteInput = z.infer<typeof PaymentQuoteSchema>

app.post(
  '/payment/quotes',
  zValidator('json', PaymentQuoteSchema, (res) => {
    if (!res.success) throw res.error
  }),
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
