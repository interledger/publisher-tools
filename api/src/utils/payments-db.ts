import type { D1Database } from '@cloudflare/workers-types'
import type { Amount } from '@shared/types'
import { ensureEnd } from '@shared/utils'
import type { WalletAddressInfo } from '../types'

/** for syntax highlighting */
export const sql = String.raw

export async function savePayment(db: D1Database, data: Payment) {
  const site = getSite(data.url)
  const normalizedUrl = normalizeUrl(data.url)
  const now = Date.now()

  const [hashedUrl, hashedSenderId, hashedSenderUrl] = await Promise.all([
    hash(normalizedUrl),
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
): Promise<boolean> {
  if (status === 'failed') {
    // If failed (money stayed in user wallet), delete from both tables.
    // The first call deletes from meta table only if `status = 0` in the main
    // table (as meta table doens't have status), then we do the main table
    // delete. This is done to ensure data consistency, even if slightly more
    // expensive.
    const res = await db.batch([
      db
        .prepare(
          sql`DELETE FROM paywall_payments_meta WHERE paymentId = ?
              AND EXISTS (SELECT 1 FROM paywall_payments
                WHERE paymentId = ? AND status = 0)`,
        )
        .bind(paymentId, paymentId),
      db
        .prepare(
          sql`DELETE FROM paywall_payments WHERE paymentId = ? AND status = 0`,
        )
        .bind(paymentId),
    ])
    return res[0].meta.changes + res[0].meta.changes === 2
  }

  const res = await db
    .prepare(sql`UPDATE paywall_payments SET status = ? WHERE paymentId = ?`)
    .bind(mapStatusToId(status), paymentId)
    .run()
  return res.meta.changes === 1
}

export async function hasPayment(
  db: D1Database,
  url: string,
  payer: Pick<WalletAddressInfo, 'id' | '$url'>,
): Promise<false | PaymentStatus> {
  const normalizedUrl = normalizeUrl(new URL(url))
  const [hashedUrl, hashedPayerWalletAddressId, hashedPayerWalletAddressUrl] =
    await Promise.all([hash(normalizedUrl), hash(payer.id), hash(payer.$url)])

  const res = await db
    .prepare(
      sql`SELECT paymentId, status FROM paywall_payments
          WHERE url = ? AND (sender = ? OR senderUrl = ?)
          LIMIT 1`,
    )
    .bind(hashedUrl, hashedPayerWalletAddressId, hashedPayerWalletAddressUrl)
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
  return status === 'complete' ? 1 : 0
}

function mapStatusIdToStatus(status: 0 | 1): PaymentStatus {
  return status === 1 ? 'complete' : 'created'
}

function getSite(url: URL) {
  return url.hostname
}

function normalizeUrl(url: URL) {
  const { origin, pathname } = url
  const path = /\.html?$/.test(pathname) ? pathname : ensureEnd(pathname, '/')
  return origin + path
}

export async function hash(text: string): Promise<HashedString> {
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
  sender: Pick<WalletAddressInfo, 'id' | '$url'>
  receiver: Pick<WalletAddressInfo, 'id' | '$url'>
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
