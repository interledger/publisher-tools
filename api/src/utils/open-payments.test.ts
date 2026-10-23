import { describe, it, expect, vi } from 'vitest'
import type { OutgoingPayment } from '@interledger/open-payments'
import type * as SharedUtils from '@shared/utils'
import { OpenPaymentsService } from './open-payments.js'

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

const amount = (value: string) => ({ value, assetCode: 'USD', assetScale: 2 })

const outgoingPayment = (
  overrides: Partial<OutgoingPayment> = {},
): OutgoingPayment =>
  ({
    id: 'https://wallet.test/outgoing-payments/1',
    failed: false,
    debitAmount: amount('500'),
    sentAmount: amount('0'),
    ...overrides,
  }) as OutgoingPayment

function setup(...responses: OutgoingPayment[]) {
  const get = vi.fn()
  for (const response of responses) get.mockResolvedValueOnce(response)

  const service = new OpenPaymentsService()
  // client is private
  Object.assign(service, { client: { outgoingPayment: { get } } })

  const poll = () =>
    service.pollOutgoingPayment('https://wallet.test/outgoing-payments/1', 'x')
  return { get, poll }
}

describe('OpenPaymentsService.pollOutgoingPayment', () => {
  it('returns success once the full amount is sent', async () => {
    const { get, poll } = setup(
      outgoingPayment(),
      outgoingPayment({ sentAmount: amount('500') }),
    )

    await expect(poll()).resolves.toEqual({ success: true })
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('fails right away when the payment is failed, without a reason', async () => {
    const { get, poll } = setup(outgoingPayment({ failed: true }))

    await expect(poll()).resolves.toEqual({
      success: false,
      error: {
        code: 'OUTGOING_PAYMENT_FAILED',
        message: 'The payment failed to send its full amount.',
      },
    })
    expect(get).toHaveBeenCalledTimes(1)
  })

  it('fails right away when the payment is failed, with metadata but no reason', async () => {
    const { poll } = setup(
      outgoingPayment({ failed: true, metadata: { description: 'test' } }),
    )

    await expect(poll()).resolves.toMatchObject({
      success: false,
      error: { code: 'OUTGOING_PAYMENT_FAILED' },
    })
  })

  it('includes the cancellation reason when the wallet provides one', async () => {
    const { get, poll } = setup(
      outgoingPayment({
        failed: true,
        metadata: { cancellationReason: 'insufficient funds' },
      }),
    )

    await expect(poll()).resolves.toEqual({
      success: false,
      error: {
        code: 'CANCELLATION_REASON',
        message: 'Payment aborted due to: insufficient funds',
      },
    })
    expect(get).toHaveBeenCalledTimes(1)
  })

  it('fails when the payment becomes failed while polling', async () => {
    const { get, poll } = setup(
      outgoingPayment(),
      outgoingPayment({ failed: true, sentAmount: amount('200') }),
    )

    await expect(poll()).resolves.toMatchObject({
      success: false,
      error: { code: 'OUTGOING_PAYMENT_FAILED' },
    })
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('reports an incomplete payment if it is still pending after polling', async () => {
    const { get, poll } = setup(
      outgoingPayment(),
      outgoingPayment(),
      outgoingPayment(),
    )

    await expect(poll()).resolves.toMatchObject({
      success: false,
      error: { code: 'OUTGOING_PAYMENT_INCOMPLETE' },
    })
    expect(get).toHaveBeenCalledTimes(3)
  })
})
