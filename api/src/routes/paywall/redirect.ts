import z from 'zod'
import { fromAmount, urlWithParams } from '@shared/utils'
import { app } from '../../app'
import { PaymentIdSchema } from '../../schemas/payment'
import {
  savePayment,
  setPaymentStatus,
  UNSAFE_devEmptyDatabase,
} from '../../utils/payments-db'
import { getData } from '../../utils/payments-kv'
import { validate } from '../../utils/utils'

const schema = z.object({
  // Passed by client
  next: z.url(),
  // Set by /payment/redirect
  paymentId: PaymentIdSchema,
  result: z.enum(['success', 'failure']),
})

app.get('/paywall/redirect', validate('query', schema), async (c) => {
  console.log(c.req.url)
  const { req, redirect, env } = c
  const { next, paymentId, result } = req.valid('query')

  await UNSAFE_devEmptyDatabase(env.PUBLISHER_TOOLS_DB)

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
      urlWithParams(next, { paymentId, status: 'failure', reason: 'internal' }),
    )
  }

  return redirect(urlWithParams(next, { paymentId, result }))
})
