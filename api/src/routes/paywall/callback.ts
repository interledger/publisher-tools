import z from 'zod'
import { urlWithParams } from '@shared/utils'
import { app } from '../../app'
import { PaymentIdSchema } from '../../schemas/payment'
import { savePayment } from '../../utils/payments-db'
import { getData } from '../../utils/payments-kv'
import { validate } from '../../utils/utils'
import { createToken } from '../auth/utils'

const schema = z.object({
  // Passed by client
  next: z.url(),
  // Set by /payment/redirect
  paymentId: PaymentIdSchema,
  result: z.enum(['success', 'failure']),
})

app.get('/paywall/callback', validate('query', schema), async (c) => {
  const { req, redirect, env } = c
  const { next, paymentId, result } = req.valid('query')

  if (result === 'failure') {
    return redirect(urlWithParams(next, { paymentId, result }))
  }

  const data = await getData(c.env.PUBLISHER_TOOLS_KV, paymentId)
  if (!data) {
    console.error(`Missing payment info: ${paymentId}`)
    return redirect(
      urlWithParams(next, { paymentId, result: 'failure', reason: 'internal' }),
    )
  }
  if (data.status === 'PENDING' || data.status === 'GRANT_REJECTED') {
    throw new Error(`Unexpected payment status: ${data.status}`)
  }
  const { incomingPaymentId, outgoingPaymentId, receiver, sender } = data

  try {
    await savePayment(env.PUBLISHER_TOOLS_DB, {
      paymentId,
      url: new URL(next),
      incomingPaymentId,
      outgoingPaymentId,
      sender,
      receiver,
      status: data.status,
      amount: data.amount,
    })
  } catch (err) {
    console.error(err)
    return redirect(
      urlWithParams(next, { paymentId, result: 'failure', reason: 'internal' }),
    )
  }

  const token = await createToken(sender, env.JWT_SECRET)
  return redirect(urlWithParams(next, { paymentId, result, token }))
})
