import z from 'zod'
import { app } from '../../app.js'
import { WalletAddressSchema } from '../../schemas/payment.js'
import { OpenPaymentsService } from '../../utils/open-payments.js'
import { createHTTPException, validate } from '../../utils/utils.js'

const PaymentValidateSchema = z.object({
  sender: WalletAddressSchema,
  receiver: WalletAddressSchema,
})

export type PaymentValidateInput = z.infer<typeof PaymentValidateSchema>

export type PaymentValidateResult =
  | { compatible: true }
  | { error: 'WALLET_MISMATCH' }

// Best-effort metadata pre-check — fail-fast before the probe-quote round-trip.
// No-op for now; signals tracked in #784.
const hasIncompatibleMetadata = (
  _sender: PaymentValidateInput['sender'],
  _receiver: PaymentValidateInput['receiver'],
): boolean => false

app.post(
  '/payment/validate',
  validate('json', PaymentValidateSchema),
  async ({ req, json, env }) => {
    const { sender, receiver } = req.valid('json')

    if (hasIncompatibleMetadata(sender, receiver)) {
      return json(
        { error: 'WALLET_MISMATCH' } satisfies PaymentValidateResult,
        400,
      )
    }

    try {
      const openPayments = await OpenPaymentsService.getInstance(env)
      const result = await openPayments.probeWalletCompatibility(
        sender,
        receiver,
      )
      if (!result.ok) {
        return json({ error: result.code } satisfies PaymentValidateResult, 400)
      }
      return json({ compatible: true } satisfies PaymentValidateResult)
    } catch (error) {
      console.error(error)
      throw createHTTPException(500, 'Payment validation error: ', error)
    }
  },
)
