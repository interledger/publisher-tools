import { env } from 'cloudflare:workers'
import { describe, it, expect, beforeEach } from 'vitest'
import { ensureEnd } from '@shared/utils'
import {
  savePayment,
  getPayment,
  findPayment,
  setPaymentStatus,
  UNSAFE_devEmptyDatabase,
  hash,
  sql,
} from './payments-db'

const DB = env.PUBLISHER_TOOLS_DB

beforeEach(() => UNSAFE_devEmptyDatabase(DB))

const mockPayment = {
  url: new URL('https://myblog.com/premium-post'),
  paymentId: 'cuid_12345',
  status: 'complete' as const,
  incomingPaymentId: 'https://wallet.com/incoming/1',
  outgoingPaymentId: 'https://wallet.com/outgoing/2',
  amount: { value: '500', assetCode: 'USD', assetScale: 2 },
  sender: { id: 'https://wallet.com/sender', $url: 'https://sender.com' },
  receiver: { id: 'https://wallet.com/recv', $url: 'https://receiver.com' },
}

describe('Paywall Database', () => {
  it('should successfully save a payment and later find it', async () => {
    await savePayment(DB, mockPayment)
    await expect(
      DB.exec(sql`SELECT * from paywall_payments`),
    ).resolves.toMatchObject({ count: 1 })

    await expect(
      findPayment(DB, mockPayment.url.href, mockPayment.sender),
    ).resolves.toEqual({ status: 'complete', paymentId: mockPayment.paymentId })
  })

  it('should grant access using the fallback wallet URL if the internal ID changes', async () => {
    await savePayment(DB, mockPayment)
    await expect(
      DB.exec(sql`SELECT * from paywall_payments`),
    ).resolves.toMatchObject({ count: 1 })

    await expect(
      findPayment(DB, mockPayment.url.href, {
        ...mockPayment.sender,
        id: 'https://wallet.com/sender2',
      }),
    ).resolves.toEqual({ status: 'complete', paymentId: mockPayment.paymentId })
  })

  it('should return falsy when a user has not paid for the content', async () => {
    await expect(
      findPayment(DB, 'https://myblog.com/other-post', mockPayment.sender),
    ).resolves.toBeFalsy()

    await savePayment(DB, mockPayment)
    await expect(
      findPayment(DB, 'https://myblog.com/other-post', mockPayment.sender),
    ).resolves.toBeFalsy()

    await expect(
      findPayment(DB, mockPayment.url.href, {
        id: 'https://wallet.com/stranger',
        $url: 'https://stranger.com',
      }),
    ).resolves.toBeFalsy()
  })

  it('should normalize URLs when storing payments', async () => {
    const url = new URL(mockPayment.url)
    url.searchParams.set('foo', 'bar')
    await savePayment(DB, { ...mockPayment, url })
    await expect(
      DB.exec(sql`SELECT * from paywall_payments`),
    ).resolves.toMatchObject({ count: 1 })

    await expect(
      findPayment(DB, url.href, {
        ...mockPayment.sender,
        id: 'https://wallet.com/sender2',
      }),
    ).resolves.toEqual({ status: 'complete', paymentId: mockPayment.paymentId })

    url.searchParams.set('bar', 'baz')
    await expect(
      findPayment(DB, url.href, {
        ...mockPayment.sender,
        id: 'https://wallet.com/sender2',
      }),
    ).resolves.toEqual({ status: 'complete', paymentId: mockPayment.paymentId })

    await expect(
      findPayment(DB, url.origin + ensureEnd(url.pathname, '/'), {
        ...mockPayment.sender,
        id: 'https://wallet.com/sender2',
      }),
    ).resolves.toEqual({ status: 'complete', paymentId: mockPayment.paymentId })
  })

  it('should fetch the full, reconstructed payment record using getPayment', async () => {
    await savePayment(DB, mockPayment)
    const result = await getPayment(DB, mockPayment.paymentId)

    expect(result).not.toBeNull()
    expect(result!.paymentId).toBe(mockPayment.paymentId)
    expect(result!.status).toBe('complete')
    expect(result!.amount).toEqual(mockPayment.amount)

    // Assert the fields contain the hashed values, not plain text
    expect(result!.url).not.toBe(mockPayment.url.href)
    expect(result!.sender.id).not.toBe(mockPayment.sender.id)
    const urlHash = await hash(ensureEnd(mockPayment.url.href, '/'))
    expect(result!.url).toBe(urlHash)
  })

  it('should update payment status from created to complete', async () => {
    await savePayment(DB, { ...mockPayment, status: 'created' })

    await expect(
      findPayment(DB, mockPayment.url.href, mockPayment.sender),
    ).resolves.toEqual({ status: 'created', paymentId: mockPayment.paymentId })

    await setPaymentStatus(DB, mockPayment.paymentId, 'complete')

    await expect(
      findPayment(DB, mockPayment.url.href, mockPayment.sender),
    ).resolves.toEqual({ status: 'complete', paymentId: mockPayment.paymentId })
  })

  it('should delete the payment records when status is set to failed', async () => {
    await savePayment(DB, { ...mockPayment, status: 'created' })
    const mockPayment2 = {
      ...mockPayment,
      paymentId: 'cuid_54321',
      url: new URL('https://example.com/'),
      status: 'created' as const,
    }
    await savePayment(DB, mockPayment2)

    await expect(
      findPayment(DB, mockPayment.url.href, mockPayment.sender),
    ).resolves.toEqual({ status: 'created', paymentId: mockPayment.paymentId })

    const changed = await setPaymentStatus(DB, mockPayment.paymentId, 'failed')
    expect(changed).toBe(true)

    await expect(
      findPayment(DB, mockPayment.url.href, mockPayment.sender),
    ).resolves.toBeFalsy()

    const countByPaymentId = (paymentId: string) =>
      DB.prepare(
        sql`SELECT COUNT(*) as count from paywall_payments WHERE paymentId = ?`,
      )
        .bind(paymentId)
        .first()

    await expect(
      countByPaymentId(mockPayment.paymentId),
    ).resolves.toMatchObject({ count: 0 })
    await expect(
      countByPaymentId(mockPayment2.paymentId),
    ).resolves.toMatchObject({ count: 1 })

    await expect(
      DB.exec(sql`SELECT COUNT(*) as count from paywall_payments`),
    ).resolves.toMatchObject({ count: 1 })
    await expect(
      DB.exec(sql`SELECT COUNT(*) as count from paywall_payments_meta`),
    ).resolves.toMatchObject({ count: 1 })
  })

  it('should only delete payment records when status is set to failed and not already complete', async () => {
    await savePayment(DB, { ...mockPayment, status: 'complete' })
    await expect(
      findPayment(DB, mockPayment.url.href, mockPayment.sender),
    ).resolves.toEqual({ status: 'complete', paymentId: mockPayment.paymentId })

    const changed = await setPaymentStatus(DB, mockPayment.paymentId, 'failed')
    expect(changed).toBe(false)
    await expect(
      findPayment(DB, mockPayment.url.href, mockPayment.sender),
    ).resolves.toEqual({ status: 'complete', paymentId: mockPayment.paymentId })

    await expect(
      DB.exec(sql`SELECT COUNT(*) as count from paywall_payments`),
    ).resolves.toMatchObject({ count: 1 })
    await expect(
      DB.exec(sql`SELECT COUNT(*) as count from paywall_payments_meta`),
    ).resolves.toMatchObject({ count: 1 })
  })
})
