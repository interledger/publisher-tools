import { env } from 'cloudflare:workers'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { OutgoingPayment } from '@interledger/open-payments'
import { createId } from '@paralleldrive/cuid2'
import type * as SharedUtils from '@shared/utils'
import { app } from '../../app.js'
import { OpenPaymentsService } from '../../utils/open-payments.js'
import {
  getPayment,
  savePayment,
  UNSAFE_devEmptyDatabase,
} from '../../utils/payments-db.js'
import { getData, setData } from '../../utils/payments-kv.js'
import './payment-status.js'

// The real module doesn't load in the workers test environment, and these
// tests don't need the client.
vi.mock('@interledger/open-payments', () => ({
  createAuthenticatedClient: vi.fn(),
  isFinalizedGrantWithAccessToken: vi.fn(),
  isPendingGrant: vi.fn(),
  OpenPaymentsClientError: class extends Error {},
}))

vi.mock('@shared/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof SharedUtils>()),
  sleep: vi.fn(() => Promise.resolve()),
}))

// `cloudflare:workers` types the binding differently from `KVNamespace`
const KV = env.PUBLISHER_TOOLS_KV as unknown as Parameters<typeof setData>[0]

const amount = { value: '500', assetCode: 'USD', assetScale: 2 }
const wallet = (name: string) => ({
  id: `https://wallet.test/${name}`,
  $url: `https://wallet.test/${name}`,
  assetCode: 'USD',
  assetScale: 2,
  authServer: 'https://wallet.test/auth',
  resourceServer: 'https://wallet.test',
})
const sender = wallet('sender')
const receiver = wallet('receiver')

async function createPayment(outgoingPayment: Partial<OutgoingPayment>) {
  const paymentId = createId()
  const outgoingPaymentId = 'https://wallet.test/outgoing-payments/1'
  const incomingPaymentId = 'https://wallet.test/incoming-payments/1'

  await savePayment(env.PUBLISHER_TOOLS_DB, {
    url: new URL('https://blog.test/post'),
    paymentId,
    status: 'created',
    incomingPaymentId,
    outgoingPaymentId,
    amount,
    sender,
    receiver,
  })
  await setData(KV, paymentId, {
    status: 'CREATED',
    outgoingPaymentId,
    incomingPaymentId,
    sender,
    receiver,
    amount,
    redirectUrl: 'https://blog.test/post',
    outgoingPaymentGrantAccessToken: 'token',
  })

  const service = new OpenPaymentsService()
  // client is private
  Object.assign(service, {
    client: {
      outgoingPayment: {
        get: vi.fn().mockResolvedValue({
          id: outgoingPaymentId,
          debitAmount: amount,
          sentAmount: { ...amount, value: '0' },
          ...outgoingPayment,
        }),
      },
    },
  })
  vi.spyOn(OpenPaymentsService, 'getInstance').mockResolvedValue(service)

  return paymentId
}

const getStatus = async (paymentId: string) => {
  const res = await app.request(`/paywall/payment-status/${paymentId}`, {}, env)
  expect(res.status).toBe(200)
  return res.json()
}

describe('GET /paywall/payment-status/:paymentId', () => {
  beforeEach(() => UNSAFE_devEmptyDatabase(env.PUBLISHER_TOOLS_DB))
  afterEach(() => vi.restoreAllMocks())

  it('reports a failed outgoing payment instead of polling it', async () => {
    const paymentId = await createPayment({ failed: true })

    await expect(getStatus(paymentId)).resolves.toMatchObject({
      type: 'PAYMENT_CREATED',
    })
    // the payment didn't go through, so it doesn't give access to the content
    await expect(
      getPayment(env.PUBLISHER_TOOLS_DB, paymentId),
    ).resolves.toBeFalsy()
    await expect(getData(KV, paymentId)).resolves.toMatchObject({
      status: 'COMPLETE',
      result: 'failure',
    })

    await expect(getStatus(paymentId)).resolves.toEqual({
      type: 'PAYMENT_DONE',
      outgoingPaymentId: 'https://wallet.test/outgoing-payments/1',
      result: 'failure',
      error: {
        code: 'OUTGOING_PAYMENT_FAILED',
        message: 'The payment failed to send its full amount.',
      },
    })
  })

  it('keeps polling a payment that is still in progress', async () => {
    const paymentId = await createPayment({ failed: false })

    await expect(getStatus(paymentId)).resolves.toMatchObject({
      type: 'PAYMENT_CREATED',
    })
    await expect(getData(KV, paymentId)).resolves.toMatchObject({
      status: 'CREATED',
    })
    await expect(
      getPayment(env.PUBLISHER_TOOLS_DB, paymentId),
    ).resolves.toBeTruthy()
  })
})
