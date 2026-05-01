import type {
  ApiErrorResponse,
  PaymentInitiateInput,
  PaymentInitiateResult,
  PaymentQuoteInput,
  PaymentQuoteResult,
  WalletAddressInfo,
} from 'publisher-tools-api'
import { API_URL, APP_URL } from '@shared/defines'
import type { WidgetProfile } from '@shared/types'
import { checkHrefFormat, fromAmount, toWalletAddressUrl } from '@shared/utils'
import { PaymentWidget } from '@tools/components'
import { appendPaymentPointer, fetchProfile, getScriptParams } from './utils'

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
    async getWallet(walletAddressUrl) {
      walletAddressUrl = checkHrefFormat(toWalletAddressUrl(walletAddressUrl))

      const url = new URL('/wallet', API_URL)
      url.searchParams.set('walletAddress', walletAddressUrl)

      const response = await fetch(url)
      const data = await response.json()
      if (!response.ok) {
        throw new Error((data as ApiErrorResponse).error?.message)
      }
      return data as WalletAddressInfo
    },
    async fetchQuote({ sender, receiver, amount }) {
      const url = new URL('/payment/quotes', API_URL)
      const body: PaymentQuoteInput = {
        sender,
        receiver,
        debitAmount: Number(amount),
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
        debitAmount: Number(amount),
        note,
        redirectUrl: new URL('payment-confirmation', frontendUrl).href,
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
    async waitForCompletion(paymentId) {},
  })
  element.config = {
    apiUrl: API_URL,
    cdnUrl: params.cdnUrl,
    frontendUrl,
    receiverAddress: walletAddressUrl,
    profile,
  }

  element.style.position = 'fixed'
  element.style.bottom = '20px'
  element.style.right = '20px'
  element.style.left = '20px'
  element.style.zIndex = '9999'

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
