import z from 'zod'
import { app } from '../../app.js'
import { PaymentIdSchema } from '../../schemas/payment.js'
import { validate } from '../../utils/utils.js'

const schema = z.object({
  site: z.string(),
  walletAddress: z.string(),
  walletAddressId: z.string(),
  url: z.string(),
  paymentId: PaymentIdSchema,
  outgoingPaymentId: z.url(),
  incomingPaymentId: z.url(),
})

export type PaywallSaveInput = z.infer<typeof schema>

// validate payment, store in db, return a cookie which /paywall/check can use in future
app.post('/paywall/save', validate('json', schema), async (c) => {})
