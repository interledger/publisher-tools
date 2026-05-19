import type { D1Database } from '@cloudflare/workers-types'
import type { Amount } from '@shared/types'
import type { WalletAddressInfo } from '../types'

const sql = String.raw // for syntax highlighting

export async function savePayment(db: D1Database, data: Payment) {
  const site = getSite(data.url)
  const now = Date.now()

  const [hashedUrl, hashedSenderId, hashedSenderUrl] = await Promise.all([
    hash(data.url.href),
    hash(data.sender.id),
    hash(data.sender.$url),
  ])

  await db.batch([
    db
      .prepare(
        sql`INSERT INTO paywall_payments (
          site, url, sender, senderUrl, paymentId, status
        ) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        site,
        hashedUrl,
        hashedSenderId,
        hashedSenderUrl,
        data.paymentId,
        mapStatusToId(data.status.toLowerCase() as PaymentStatus),
      ),
    db
      .prepare(
        sql`INSERT INTO paywall_payments_meta (
          paymentId, outgoingPaymentId, incomingPaymentId, receiver, receiverUrl, ts, amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        data.paymentId,
        data.outgoingPaymentId,
        data.incomingPaymentId,
        data.receiver.id,
        data.receiver.$url,
        now,
        JSON.stringify(data.amount),
      ),
  ])
}

export async function setPaymentStatus(
  db: D1Database,
  paymentId: Payment['paymentId'],
  status: PaymentStatus | 'failed',
) {
  if (status === 'failed') {
    // If failed (money stayed in user wallet), delete from both tables.
    await db.batch([
      db
        .prepare(`DELETE FROM paywall_payments WHERE paymentId = ?`)
        .bind(paymentId),
      db
        .prepare(`DELETE FROM paywall_payments_meta WHERE paymentId = ?`)
        .bind(paymentId),
    ])
    return
  }

  await db
    .prepare(sql`UPDATE paywall_payments SET status = ? WHERE paymentId = ?`)
    .bind(mapStatusToId(status), paymentId)
    .run()
}

export async function hasPayment(
  db: D1Database,
  url: string,
  payer: Pick<WalletAddressInfo, 'id' | '$url'>,
): Promise<false | PaymentStatus> {
  const [hashedUrl, hashedPayerId, hashedPayerWalletAddressUrl] =
    await Promise.all([hash(url), hash(payer.id), hash(payer.$url)])

  const res = await db
    .prepare(
      sql`SELECT paymentId, status FROM paywall_payments
          WHERE url = ? AND (sender = ? OR senderWalletAddressUrl = ?)
          LIMIT 1`,
    )
    .bind(hashedUrl, hashedPayerId, hashedPayerWalletAddressUrl)
    .first<Pick<PaywallPaymentRow, 'paymentId' | 'status'>>()

  if (!res?.paymentId) {
    return false
  }

  return res.status === 1 ? 'complete' : 'created'
}

export async function getPayment(db: D1Database, paymentId: string) {
  const row = await db
    .prepare(
      sql`SELECT *
      FROM paywall_payments p
      INNER JOIN paywall_payments_meta m ON p.paymentId = m.paymentId
      WHERE p.paymentId = ?
      LIMIT 1`,
    )
    .bind(paymentId)
    .first<PaywallPaymentRow & PaywallPaymentMetaRow>()

  if (!row) {
    return null
  }

  const { site, url, incomingPaymentId, outgoingPaymentId } = row
  return {
    paymentId,
    site,
    url,
    status: mapStatusIdToStatus(row.status),
    ts: new Date(row.ts),
    incomingPaymentId,
    outgoingPaymentId,
    amount: JSON.parse(row.amount) as Amount,
    receiver: { id: row.receiver, $url: row.receiverUrl },
    sender: { id: row.sender, $url: row.senderUrl },
  }
}

/**
 * @deprecated
 * @unsafe
 */
export async function UNSAFE_devEmptyDatabase(db: D1Database) {
  await db.batch([
    db.prepare(`DELETE FROM paywall_payments_meta`),
    db.prepare(`DELETE FROM paywall_payments`),
  ])
}

function mapStatusToId(status: PaymentStatus) {
  return status.toLowerCase() === 'created' ? 0 : 1
}

function mapStatusIdToStatus(status: 0 | 1): PaymentStatus {
  return status === 1 ? 'complete' : 'created'
}

function getSite(url: URL) {
  return url.hostname
}

async function hash(text: string): Promise<HashedString> {
  const msgBuffer = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('') as HashedString
}

type HashedString = string & { readonly __brand: 'HashedString' }

type PaymentStatus = 'created' | 'complete'

interface Payment {
  url: URL
  sender: Pick<WalletAddressInfo, 'id' | '$url' | 'assetCode'>
  receiver: Pick<WalletAddressInfo, 'id' | '$url' | 'assetCode'>
  paymentId: string
  status: PaymentStatus | 'CREATED' | 'COMPLETE'
  incomingPaymentId: string
  outgoingPaymentId: string
  amount: Amount
}

// #region Tables

/**
 * Represents a raw row inside the 'paywall_payments' table.
 * All sensitive identity/routing fields are stored as hex-encoded SHA-256 strings.
 */
interface PaywallPaymentRow {
  site: string
  url: HashedString
  sender: HashedString // walletAddress.id
  senderUrl: HashedString
  paymentId: string // Unique string ID
  status: 0 | 1 // 0: created, 1: complete
}

/**
 * Represents a raw row inside the 'paywall_payments_meta' table.
 */
export interface PaywallPaymentMetaRow {
  paymentId: string // Primary key matching paywall_payments.paymentId
  outgoingPaymentId: string
  incomingPaymentId: string
  receiver: string // walletAddress.id
  receiverUrl: string
  ts: number // Unix timestamp via Date.now()
  amount: string // stored as JSON.stringify(Amount)
}
// #endregion
