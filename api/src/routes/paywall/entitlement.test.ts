import { env } from 'cloudflare:workers'
import { sign } from 'hono/jwt'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { app } from '../../app.js'
import {
  savePayment,
  UNSAFE_devEmptyDatabase,
} from '../../utils/payments-db.js'
import { createToken } from '../auth/utils.js'
import './entitlement.js'

// The real module doesn't load in the workers test environment, and these
// tests don't need the client.
vi.mock('@interledger/open-payments', () => ({
  createAuthenticatedClient: vi.fn(),
  isFinalizedGrantWithAccessToken: vi.fn(),
  isPendingGrant: vi.fn(),
  OpenPaymentsClientError: class extends Error {},
}))

const JWT_SECRET = 'test-secret'
const testEnv = { ...env, JWT_SECRET }

const wallet = (name: string) => ({
  id: `https://wallet.test/${name}`,
  $url: `https://wallet.test/${name}`,
})
const sender = wallet('sender')
const receiver = wallet('receiver')
const pageUrl = 'https://blog.test/post'

function checkEntitlement(token: string) {
  const params = new URLSearchParams({
    url: pageUrl,
    wa: sender.id,
    $wa: sender.$url,
  })
  return app.request(
    `/paywall/entitlement?${params}`,
    { headers: { Authorization: `Bearer ${token}` } },
    testEnv,
  )
}

describe('GET /paywall/entitlement', () => {
  beforeEach(async () => {
    await UNSAFE_devEmptyDatabase(env.PUBLISHER_TOOLS_DB)
    await savePayment(env.PUBLISHER_TOOLS_DB, {
      url: new URL(pageUrl),
      paymentId: 'p1aaaaaaaaaaaaaaaaaaaaaa',
      status: 'complete',
      incomingPaymentId: 'https://wallet.test/incoming-payments/1',
      outgoingPaymentId: 'https://wallet.test/outgoing-payments/1',
      amount: { value: '500', assetCode: 'USD', assetScale: 2 },
      sender,
      receiver,
    })
  })

  it('asks a paying wallet to log in again when its token has expired', async () => {
    const now = Math.floor(Date.now() / 1000)
    const expired = await sign(
      { sub: sender.id, auth_time: now - 8 * 86400, exp: now - 86400 },
      JWT_SECRET,
      'HS256',
    )

    const res = await checkEntitlement(expired)

    expect(res.status).toBe(401)
    expect(await res.json()).toMatchObject({ entitlement: 'auth-required' })
  })

  it('asks a paying wallet to log in when the token is for another wallet', async () => {
    const otherToken = await createToken(wallet('other'), JWT_SECRET)

    const res = await checkEntitlement(otherToken)

    expect(res.status).toBe(401)
    expect(await res.json()).toMatchObject({ entitlement: 'auth-required' })
  })
})
