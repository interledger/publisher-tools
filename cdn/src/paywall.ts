import type {
  PaymentInitiateInput,
  PaymentInitiateResult,
  PaymentQuoteInput,
  PaymentQuoteResult,
  PaymentStatus,
} from 'publisher-tools-api'
import { API_URL } from '@shared/defines'
import { fromAmount, sleep } from '@shared/utils'
import { Paywall } from '@tools/components'
import { fetchProfile, getScriptParams, getWallet } from './utils'

const NAME = 'wm-paywall'
customElements.define(NAME, Paywall)

const params = getScriptParams('paywall')

drawPaywall()
function drawPaywall() {
  const price = params.otherAttributes.price?.trim()
  if (!price) throw new Error('Missing data-price attribute on script')
  if (!/^\d+(\.\d+)?$/.test(price)) {
    throw new Error(`Invalid data-price="${price}"`)
  }

  const element = document.createElement('wm-paywall')
  element.setBaseConfig({
    receiverWalletAddressUrl: params.walletAddress,
    price,
  })

  element.setController({
    fetchConfig: () => fetchProfile(API_URL, 'paywall', params),
    async checkEntitlement() {
      return 'no-access' // TODO: create and call API
    },
    async saveEntitlement() {
      // TODO: create and call API
    },
    getWallet: (walletAddressUrl) => getWallet(API_URL, walletAddressUrl),
    async fetchQuote({ sender, receiver, amount }) {
      const url = new URL('/payment/quotes', API_URL)
      const body: PaymentQuoteInput = {
        sender,
        receiver,
        receiveAmount: Number(amount),
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json: PaymentQuoteResult = await res.json()
      if (res.ok && 'receiveAmount' in json) {
        const debitAmount = fromAmount(json.debitAmount)
        const receiveAmount = fromAmount(json.receiveAmount)
        return { debitAmount, receiveAmount }
      }

      if (res.status === 400 && 'error' in json) {
        const { error, minSendAmount } = json
        return {
          error,
          ...(minSendAmount && { minSendAmount: fromAmount(minSendAmount) }),
        }
      } else {
        return {
          error: 'Failed to create payment. Please try a different amount.',
        }
      }
    },
    async initiatePayment({ sender, receiver, amount, note }) {
      const url = new URL('/payment/initiate', API_URL).href
      const body: PaymentInitiateInput = {
        sender,
        receiver,
        receiveAmount: Number(amount),
        note,
        redirectUrl: window.location.href,
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        throw new Error(
          `Failed to initiate payment. HTTP ${res.status} (${res.statusText})`,
        )
      }
      const json: PaymentInitiateResult = await res.json()
      return {
        grantRedirectUrl: json.grantRedirectUrl,
        paymentId: json.paymentId,
      }
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
