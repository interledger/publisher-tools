import { env } from 'cloudflare:workers'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  savePayment,
  getPayment,
  hasPayment,
  setPaymentStatus,
  UNSAFE_devEmptyDatabase,
  hash,
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
      DB.exec('SELECT * from paywall_payments'),
    ).resolves.toMatchObject({ count: 1 })

    await expect(
      hasPayment(DB, mockPayment.url.href, mockPayment.sender),
    ).resolves.toBe('complete')
  })

  it('should grant access using the fallback wallet URL if the internal ID changes', async () => {
    await savePayment(DB, mockPayment)
    await expect(
      DB.exec('SELECT * from paywall_payments'),
    ).resolves.toMatchObject({ count: 1 })

    await expect(
      hasPayment(DB, mockPayment.url.href, {
        ...mockPayment.sender,
        id: 'https://wallet.com/sender2',
      }),
    ).resolves.toBe('complete')
  })

  it('should return falsy when a user has not paid for the content', async () => {
    await expect(
      hasPayment(DB, 'https://myblog.com/other-post', mockPayment.sender),
    ).resolves.toBeFalsy()

    await savePayment(DB, mockPayment)
    await expect(
      hasPayment(DB, 'https://myblog.com/other-post', mockPayment.sender),
    ).resolves.toBeFalsy()

    await expect(
      hasPayment(DB, mockPayment.url.href, {
        id: 'https://wallet.com/stranger',
        $url: 'https://stranger.com',
      }),
    ).resolves.toBeFalsy()
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
    const urlHash = await hash(mockPayment.url.href)
    expect(result!.url).toBe(urlHash)
  })

  it('should update payment status from created to complete', async () => {
    await savePayment(DB, { ...mockPayment, status: 'created' })

    await expect(
      hasPayment(DB, mockPayment.url.href, mockPayment.sender),
    ).resolves.toBe('created')

    await setPaymentStatus(DB, mockPayment.paymentId, 'complete')

    await expect(
      hasPayment(DB, mockPayment.url.href, mockPayment.sender),
    ).resolves.toBe('complete')
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
      hasPayment(DB, mockPayment.url.href, mockPayment.sender),
    ).resolves.toBe('created')

    await setPaymentStatus(DB, mockPayment.paymentId, 'failed')

    await expect(
      hasPayment(DB, mockPayment.url.href, mockPayment.sender),
    ).resolves.toBeFalsy()

    const countByPaymentId = (paymentId: string) =>
      DB.prepare(
        'SELECT COUNT(*) as count from paywall_payments WHERE paymentId = ?',
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
      DB.exec('SELECT COUNT(*) as count  from paywall_payments'),
    ).resolves.toMatchObject({ count: 1 })
    await expect(
      DB.exec('SELECT COUNT(*) as count  from paywall_payments_meta'),
    ).resolves.toMatchObject({ count: 1 })
  })
})
