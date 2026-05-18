import type { PaymentStatus, WalletAddressInfo } from 'publisher-tools-api'
import { API_URL } from '@shared/defines'
import { ensureEnd, sleep, urlWithParams } from '@shared/utils'
import { Paywall } from '@tools/components'
import {
  fetchProfile,
  getScriptParams,
  getWallet,
  initiatePayment,
} from './utils'

const NAME = 'wm-paywall'
customElements.define(NAME, Paywall)

const params = getScriptParams('paywall')

drawPaywall()
function drawPaywall() {
  const price = params.otherAttributes.price?.trim()
  if (price && !/^\d+(\.\d+)?$/.test(price)) {
    throw new Error(`Invalid data-price="${price}"`)
  }

  const pageUrl = getPageUrl()

  const element = document.createElement('wm-paywall')
  if (price) element.setPrice(price)
  const actions = element.setController({
    receiverWalletAddressUrl: params.walletAddress,
    cdnUrl: params.cdnUrl,
    fetchConfig: () => fetchProfile(API_URL, 'paywall', params),
    async checkEntitlement() {
      return 'no-access' // TODO: create and call API
    },
    async saveEntitlement() {
      // TODO: create and call API
    },
    async validateWalletOwnership(_walletAddress) {
      // TODO: create a grant request, redirect
      throw new Error('NOT IMPLEMENTED')
    },
    getWallet: (walletAddressUrl) => getWallet(API_URL, walletAddressUrl),
    async initiatePayment({ sender, receiver, amount, note }) {
      const receiveAmount = Number(amount)
      // When a grant accept request redirects to this URL, the backend stores
      // payment details in DB, and sends user back to `pageUrl`.
      const redirectUrl = urlWithParams(new URL('/paywall/redirect', API_URL), {
        next: pageUrl,
      }).href
      const result = await initiatePayment(API_URL, {
        sender,
        receiver,
        receiveAmount,
        note,
        redirectUrl,
      })
      if (result.grantRedirectUrl) {
        saveToLocalStorage(pageUrl, { sender, paymentId: result.paymentId })
        window.location.href = result.grantRedirectUrl
      }
      return result
    },
    async *getStatus(paymentId, signal) {
      const url = new URL(`/payment/status/${paymentId}`, API_URL).href
      while (true) {
        try {
          signal?.throwIfAborted()
          const res = await fetch(url, { signal })
          if (!res.ok) {
            throw new Error('Failed to check payment status: ' + res.statusText)
          }

          const status: PaymentStatus = await res.json()
          yield status

          if (status.type === 'PENDING_GRANT_INTERACTION') {
            await sleep(3000)
          } else if (status.type === 'OUTGOING_PAYMENT_CREATED') {
            await sleep(1500)
          } else if (
            status.type === 'OUTGOING_PAYMENT_DONE' ||
            status.type === 'GRANT_REJECTED'
          ) {
            break
          } else {
            throw new Error('Unknown payment status: ' + JSON.stringify(status))
          }
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            break
          } else if (isAbortSignalTimeout(err) || isTimeoutError(err)) {
            throw new Error('Payment authorization timed out')
          } else {
            throw new Error('Failed to check payment status', { cause: err })
          }
        }
      }
    },
  })

  document.body.appendChild(element)

  const searchParams = new URLSearchParams(window.location.search)
  if (
    searchParams.get('paymentId') &&
    searchParams.get('result') === 'success'
  ) {
    const stored = getFromLocalStorage(pageUrl, searchParams)
    if (stored) {
      const { sender, paymentId } = stored
      actions.setScreen('verify', { sender, paymentId })
    }
  }
}

function isAbortSignalTimeout(ev: unknown) {
  return (
    ev instanceof Event &&
    ev.target instanceof AbortSignal &&
    isTimeoutError(ev.target.reason)
  )
}

function isTimeoutError(err: unknown) {
  return err instanceof DOMException && err.name === 'TimeoutError'
}

// Exclude any URL params, normalize path
function getPageUrl() {
  return window.location.origin + ensureEnd(window.location.pathname, '/')
}

function saveToLocalStorage(
  pageUrl: string,
  data: { sender: WalletAddressInfo; paymentId: string },
) {
  window.localStorage.setItem(
    `wmt-paywall-payment:${pageUrl}`,
    JSON.stringify({ data, ts: Date.now() }),
  )
}

function getFromLocalStorage(pageUrl: string, params: URLSearchParams) {
  const stored = window.localStorage.getItem(`wmt-paywall-payment:${pageUrl}`)
  if (!stored) return null

  try {
    const parsed = JSON.parse(stored)
    if (!parsed.ts || !parsed.data) {
      throw new Error('Invalid stored data')
    }
    // TODO: add more validation, check recency too
    if (!parsed.data.sender || !parsed.data.paymentId) {
      throw new Error('Invalid stored data')
    }
    if (parsed.data.paymentId !== params.get('paymentId')) {
      throw new Error('Stored data is for different paymentId')
    }
    return {
      sender: parsed.data.sender as WalletAddressInfo,
      paymentId: parsed.data.paymentId as string,
    }
  } catch {
    return null
  }
}
