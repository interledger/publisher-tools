import type { PaymentStatus } from 'publisher-tools-api'
import { API_URL } from '@shared/defines'
import { sleep } from '@shared/utils'
import { Paywall } from '@tools/components'
import {
  fetchProfile,
  fetchQuote,
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
    fetchQuote({ sender, receiver, amount }) {
      const receiveAmount = Number(amount)
      return fetchQuote(API_URL, { sender, receiver, receiveAmount })
    },
    async initiatePayment({ sender, receiver, amount, note }) {
      const receiveAmount = Number(amount)
      const redirectUrl = window.location.href
      return initiatePayment(API_URL, {
        sender,
        receiver,
        receiveAmount,
        note,
        redirectUrl,
      })
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
