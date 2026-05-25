import type { PaywallPaymentStatus } from 'publisher-tools-api'
import { API_URL } from '@shared/defines'
import { sleep, urlWithParams } from '@shared/utils'
import { Paywall } from '@tools/components'
import {
  fetchProfile,
  getScriptParams,
  getWallet,
  initiatePayment,
} from './utils'
import { getPageUrl } from './utils/paywall-utils'

const NAME = 'wm-paywall'
customElements.define(NAME, Paywall)

const params = getScriptParams('paywall')

drawPaywall()
function drawPaywall() {
  const price = params.otherAttributes.price?.trim()
  if (price && !/^\d+(\.\d+)?$/.test(price)) {
    throw new Error(`Invalid data-price="${price}"`)
  }

  const pageUrl = getPageUrl(window.location)

  const element = document.createElement('wm-paywall')
  if (price) element.setPrice(price)
  element.setController({
    receiverWalletAddressUrl: params.walletAddress,
    cdnUrl: params.cdnUrl,
    fetchConfig: () => fetchProfile(API_URL, 'paywall', params),
    async checkEntitlement() {
      return 'no-access' // TODO: create and call API
    },
    async saveEntitlement() {
      // TODO: create and call API
    },
    getWallet: (walletAddressUrl) => getWallet(API_URL, walletAddressUrl),
    async initiatePayment({ sender, receiver, amount, note }) {
      const receiveAmount = Number(amount)
      // When a grant accept request redirects to this URL, the backend stores
      // payment details in DB, and sends user back to `pageUrl`.
      const redirectUrl = urlWithParams(new URL('/paywall/redirect', API_URL), {
        next: pageUrl,
      }).href
      return initiatePayment(API_URL, {
        sender,
        receiver,
        receiveAmount,
        note,
        redirectUrl,
      })
    },
    async *getStatus(paymentId, signal) {
      const url = new URL(`/paywall/status/${paymentId}`, API_URL).href
      while (true) {
        try {
          signal?.throwIfAborted()
          const res = await fetch(url, { signal })
          if (!res.ok) {
            throw new Error(`Payment status check failed: HTTP ${res.status}`)
          }

          const status: PaywallPaymentStatus = await res.json()
          yield status

          if (status.type === 'PENDING_GRANT_INTERACTION') {
            await sleep(3000)
          } else if (status.type === 'PAYMENT_CREATED') {
            await sleep(1500)
          } else if (
            status.type === 'PAYMENT_DONE' ||
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
