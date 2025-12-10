import { API_URL, APP_URL } from '@shared/defines'
import type { WidgetConfig } from '@shared/types'
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

const drawWidget = (walletAddressUrl: string, profile: WidgetConfig) => {
  const element = document.createElement('wm-payment-widget')

  element.config = {
    apiUrl: API_URL,
    cdnUrl: params.cdnUrl,
    frontendUrl: new URL('/tools/', getFrontendUrlOrigin()).href,
    receiverAddress: walletAddressUrl,
    action: profile.widgetButtonText || 'Pay',
    theme: {
      primaryColor: profile.widgetButtonBackgroundColor,
      backgroundColor: profile.widgetBackgroundColor,
      textColor: profile.widgetTextColor,
      fontSize: profile.widgetFontSize,
      fontFamily: profile.widgetFontName,
      widgetBorderRadius: profile.widgetButtonBorder,
      widgetButtonBackgroundColor: profile.widgetTriggerBackgroundColor
    },
    widgetTitleText: profile.widgetTitleText,
    widgetDescriptionText: profile.widgetDescriptionText,
    isWidgetDescriptionVisible: profile.widgetDescriptionVisible,
    widgetPosition: profile.widgetPosition
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
