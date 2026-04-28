import z from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { PaymentError } from '@shared/types'
import { app } from '../../app.js'
import {
  isNonPositiveAmountError,
  OpenPaymentsService,
} from '../../utils/open-payments.js'
import { createHTTPException } from '../../utils/utils.js'

const PaymentQuoteSchema = z.object({
  senderWalletAddress: z.url('Invalid sender wallet address'),
  receiverWalletAddress: z.url('Invalid receiver wallet address'),
  amount: z.number().positive('Amount must be positive'),
  note: z.string().optional(),
})
export type PaymentQuoteInput = z.infer<typeof PaymentQuoteSchema>

app.post(
  '/payment/quote',
  zValidator('json', PaymentQuoteSchema),
  async ({ req, json, env }) => {
    try {
      const { senderWalletAddress, receiverWalletAddress, amount, note } =
        req.valid('json')

      const openPayments = await OpenPaymentsService.getInstance(env)
      const result = await openPayments.createPayment({
        senderWalletAddress,
        receiverWalletAddress,
        amount,
        note,
      })

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
      throw createHTTPException(500, 'Payment quote creation error: ', error)
    }
  },
)
