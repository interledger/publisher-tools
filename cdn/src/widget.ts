import type { ApiErrorResponse, WalletAddressInfo } from 'publisher-tools-api'
import { API_URL, APP_URL } from '@shared/defines'
import type { WidgetProfile } from '@shared/types'
import { PaymentWidget } from '@tools/components'
import { appendPaymentPointer, fetchProfile, getScriptParams } from './utils'
import { checkHrefFormat, toWalletAddressUrl } from '@shared/utils'

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
    async fetchQuote(request) {},
    async initiatePayment(request) {},
    async waitForCompletion(paymentId) {},
  })
  element.config = {
    apiUrl: API_URL,
    cdnUrl: params.cdnUrl,
    frontendUrl: new URL('/tools/', getFrontendUrlOrigin()).href,
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
