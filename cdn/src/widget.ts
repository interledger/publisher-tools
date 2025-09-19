import { PaymentWidget } from '@tools/components'
import { API_URL, APP_URL } from '@shared/defines'
import {
  appendPaymentPointer,
  fetchConfig,
  getScriptParams,
  type WidgetConfig
} from './utils'

customElements.define('wm-payment-widget', PaymentWidget)

const params = getScriptParams('widget')

appendPaymentPointer(params.walletAddress)
fetchConfig(API_URL, 'widget', params)
  .then((config) => {
    const el = drawWidget(params.walletAddress, config)
    document.body.appendChild(el)
  })
  .catch((error) => console.error(error))

const drawWidget = (walletAddressUrl: string, config: WidgetConfig) => {
  const element = document.createElement('wm-payment-widget')

  element.config = {
    apiUrl: API_URL,
    frontendUrl: new URL('/tools/', getFrontendUrlOrigin()).href,
    receiverAddress: walletAddressUrl,
    action: config.widgetButtonText || 'Pay',
    theme: {
      primaryColor: config.widgetButtonBackgroundColor,
      backgroundColor: config.widgetBackgroundColor,
      textColor: config.widgetTextColor,
      fontSize: config.widgetFontSize,
      fontFamily: config.widgetFontName,
      widgetBorderRadius: config.widgetButtonBorder,
      widgetButtonBackgroundColor: config.widgetTriggerBackgroundColor
    },
    widgetTitleText: config.widgetTitleText,
    widgetDescriptionText: config.widgetDescriptionText,
    isWidgetDescriptionVisible: config.widgetDescriptionVisible,
    widgetPosition: config.widgetPosition
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
