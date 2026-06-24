import type { PaymentStatus } from 'publisher-tools-api'
import { API_URL, APP_URL } from '@shared/defines'
import type { WidgetProfile } from '@shared/types'
import { sleep } from '@shared/utils'
import { PaymentWidget } from '@tools/components'
import {
  appendPaymentPointer,
  fetchProfile,
  fetchQuote,
  getScriptParams,
  getWallet,
  initiatePayment,
  isAbortSignalTimeout,
  isTimeoutError,
} from './utils'

customElements.define('wm-payment-widget', PaymentWidget)

const params = getScriptParams('widget')

appendPaymentPointer(params.walletAddress)
fetchProfile(API_URL, 'widget', params)
  .then((profile) => {
    const el = drawWidget(params.walletAddress, profile)
    document.body.appendChild(el)
  })
  .catch((error) => console.error(error))

const drawWidget = (walletAddressUrl: string, profile: WidgetProfile) => {
  const frontendUrl = new URL('/tools/', getFrontendUrlOrigin()).href
  const element = document.createElement('wm-payment-widget')
  element.setController({
    getWallet: (walletAddressUrl) => getWallet(API_URL, walletAddressUrl),
    async probeWalletCompatibility({ sender, receiver }) {
      const result = await fetchQuote(API_URL, {
        sender,
        receiver,
        receiveAmount: 1,
      })
      return 'error' in result && result.error === 'WALLET_MISMATCH'
        ? { ok: false, code: 'WALLET_MISMATCH' }
        : { ok: true }
    },
    fetchQuote({ sender, receiver, amount }) {
      const debitAmount = Number(amount)
      return fetchQuote(API_URL, { sender, receiver, debitAmount })
    },
    initiatePayment({ sender, receiver, amount, note }) {
      const debitAmount = Number(amount)
      const redirectUrl = new URL('payment-confirmation', frontendUrl).href
      return initiatePayment(API_URL, {
        sender,
        receiver,
        debitAmount,
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
  element.config = {
    apiUrl: API_URL,
    cdnUrl: params.cdnUrl,
    frontendUrl,
    receiverAddress: walletAddressUrl,
    profile,
  }
  return element
}

// We've a cyclic dependency between CDN and frontend URLs, so we infer it
// from the API instead to avoid this conflict during deployment.
function getFrontendUrlOrigin() {
  if (API_URL.includes('api.webmonetization.org')) {
    return APP_URL.production
  }

  if (
    API_URL.startsWith('http://localhost') ||
    API_URL.startsWith('http://127.0.0.1')
  ) {
    return APP_URL.development
  }

  return APP_URL.staging
}
