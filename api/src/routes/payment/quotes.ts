import z from 'zod'
import type { Amount, PaymentError } from '@shared/types'
import { app } from '../../app.js'
import {
  DebitOrReceiveAmountSchema,
  WalletAddressSchema,
} from '../../schemas/payment.js'
import {
  hasOpenPaymentsClientErrorCause,
  isNonPositiveAmountError,
  OpenPaymentsService,
} from '../../utils/open-payments.js'
import { createHTTPException, validate } from '../../utils/utils.js'

const PaymentQuoteSchema = z
  .object({
    sender: WalletAddressSchema,
    receiver: WalletAddressSchema,
  })
  .and(DebitOrReceiveAmountSchema)

export type PaymentQuoteInput = z.infer<typeof PaymentQuoteSchema>

app.post(
  '/payment/quotes',
  validate('json', PaymentQuoteSchema),
  async ({ req, json, env }) => {
    try {
      const openPayments = await OpenPaymentsService.getInstance(env)
      const result = await openPayments.paymentQuote(req.valid('json'))
      return json({
        debitAmount: result.debitAmount,
        receiveAmount: result.receiveAmount,
      } satisfies PaymentQuoteResult)
    } catch (error) {
      if (isNonPositiveAmountError(error)) {
        return json(
          {
            error: 'NON_POSITIVE_AMOUNT' satisfies PaymentError,
            minSendAmount: error.details?.minSendAmount,
          } satisfies PaymentQuoteResult,
          400,
        )
      }
      if (hasOpenPaymentsClientErrorCause(error)) {
        return json({ error: 'WALLET_MISMATCH' satisfies PaymentError }, 400)
      }
      console.error(error)
      throw createHTTPException(500, 'Payment quote creation error: ', error)
    }
  },
)

export type PaymentQuoteResult =
  | { debitAmount: Amount; receiveAmount: Amount }
  | { error: PaymentError; minSendAmount?: Amount }
