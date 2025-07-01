import { PaymentWidget } from '@tools/components/widget'
import { Banner } from '@tools/components/banner'

customElements.define('wm-payment-widget', PaymentWidget)
customElements.define('wm-banner', Banner)

declare global {
  interface HTMLElementTagNameMap {
    'wm-banner': BannerElement
    'wm-payment-widget': WidgetElement
  }
}

/* eslint-disable no-case-declarations */
const API_URL = import.meta.env.VITE_SCRIPT_API_URL

let paramTypes: string[] | undefined,
  paramWallet: string | undefined,
  paramTag: string = 'default',
  urlWallet

// TODO: Have a defined interface for the config
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Config = Record<string, any>
interface BannerElement extends HTMLElement {
  config: Config
}
interface WidgetElement extends HTMLElement {
  config: Config
}

const currentScript = document.getElementById(
  'wmt-init-script'
) as HTMLScriptElement
if (currentScript) {
  const scriptUrl = new URL(currentScript.src)
  const params = new URLSearchParams(scriptUrl.search)
  paramTypes = (params.get('types') || '').split('|')
  paramWallet = params.get('wa') || undefined
  paramTag = params.get('tag') || 'default'
  urlWallet = encodeURIComponent(params.get('wa') || '')
}

if (!paramTypes || !paramWallet) {
  throw 'Missing parameters! Could not initialise WM Tools.'
}

fetch(`${API_URL}tools/config/${urlWallet}/${paramTag}`)
  .then((response) => response.json())
  .then((resp) => {
    const config = resp
    drawElement(paramTypes, paramWallet as string, config)
  })
  .catch((error) => console.log(error))

const appendPaymentPointer = (walletAddressUrl: string) => {
  const monetizationElement = document.createElement('link')
  monetizationElement.rel = 'monetization'
  monetizationElement.href = walletAddressUrl
  document.head.appendChild(monetizationElement)
}

const drawElement = async (
  types: string[] | undefined,
  walletAddress: string,
  config: Config
) => {
  const walletAddressUrl = !walletAddress.startsWith('https://')
    ? `https://${walletAddress}`
    : walletAddress

  // add payment pointer / wallet address to target website first
  // so we have something to check against when displaying the banner
  appendPaymentPointer(walletAddressUrl)

  for (const key in types) {
    const type = types[Number(key)]
    switch (type) {
      case 'widget': {
        const element = drawWidget(walletAddressUrl, config)
        document.body.appendChild(element)
        break
      }
      case 'banner':
      default:
        const element = drawBanner(config)
        if (element) {
          document.body.appendChild(element)
        }
    }
  }
}

const drawBanner = (config: Config) => {
  // check if user closed the banner
  const closedByUser = sessionStorage.getItem('_wm_tools_closed_by_user')

  // check if user / visitor has monetization
  const monetizationLinks = document.querySelector<HTMLLinkElement>(
    'link[rel=monetization]'
  )
  if (
    (monetizationLinks && monetizationLinks.relList.supports('monetization')) ||
    closedByUser
  ) {
    // prevent element being created, if the extension is installed
    return
  }

  const bannerElement = document.createElement('wm-banner')

  const bannerConfig = {
    bannerTitleText: config.bannerTitleText,
    bannerDescriptionText: config.bannerDescriptionText,
    bannerBorderRadius: config.bannerBorder,
    bannerPosition: config.bannerPosition,
    bannerSlideAnimation: config.bannerSlideAnimation,
    theme: {
      backgroundColor: config.bannerBackgroundColor,
      textColor: config.bannerTextColor,
      fontFamily: config.bannerFontName,
      fontSize: config.bannerFontSize
    }
  }
  bannerElement.config = bannerConfig

  const position = config.bannerPosition
    ? config.bannerPosition.toLowerCase()
    : 'bottom'

  bannerElement.style.position = 'fixed'
  bannerElement.style.left = '0'
  bannerElement.style.right = '0'
  bannerElement.style.zIndex = '9999'

  if (position === 'top') {
    bannerElement.style.top = '0'
  } else {
    bannerElement.style.bottom = '0'
  }

  return bannerElement
}

const drawWidget = (walletAddressUrl: string, config: Config) => {
  const element = document.createElement('wm-payment-widget') as WidgetElement

  element.config = {
    apiUrl: API_URL,
    receiverAddress: walletAddressUrl,
    action: config.widgetButtonText || 'Pay',
    theme: {
      primaryColor: config.widgetButtonBackgroundColor,
      backgroundColor: config.widgetBackgroundColor,
      textColor: config.widgetTextColor,
      fontFamily: config.widgetFontName,
      widgetButtonBackgroundColor: config.widgetTriggerBackgroundColor
    },
    widgetTitleText: config.widgetTitleText,
    widgetDescriptionText: config.widgetDescriptionText
  }

  // TODO: add support for widget positioning
  element.style.position = 'fixed'
  element.style.bottom = '20px'
  element.style.right = '20px'
  element.style.zIndex = '9999'

  return element
}
