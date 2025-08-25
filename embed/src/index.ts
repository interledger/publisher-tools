import { PaymentWidget } from '@tools/components'
import { Banner } from '@tools/components/banner'
import { API_URL } from '@shared/defines'
import type { ElementConfigType } from '@shared/types'

customElements.define('wm-payment-widget', PaymentWidget)
customElements.define('wm-banner', Banner)

declare global {
  interface HTMLElementTagNameMap {
    'wm-banner': Banner
    'wm-payment-widget': PaymentWidget
  }
}

type PickByPrefix<T, P> = Pick<T, Extract<keyof T, P>>
type WidgetConfig = PickByPrefix<ElementConfigType, `widget${string}`>
type BannerConfig = PickByPrefix<ElementConfigType, `banner${string}`>
type Config = WidgetConfig | BannerConfig

let paramTypes: string[] | undefined,
  paramWallet: string | undefined,
  paramTag: string = 'default',
  urlWallet

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

fetch(`${API_URL}/tools/config/${urlWallet}/${paramTag}`)
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
        const element = drawWidget(walletAddressUrl, config as WidgetConfig)
        document.body.appendChild(element)
        break
      }
      case 'banner':
      default: {
        const element = drawBanner(config as BannerConfig)
        if (element) {
          document.body.appendChild(element)
        }
      }
    }
  }
}

const drawBanner = (config: BannerConfig) => {
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
    bannerThumbnail: config.bannerThumbnail,
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

const drawWidget = (walletAddressUrl: string, config: WidgetConfig) => {
  const element = document.createElement('wm-payment-widget')
  element.config = {
    apiUrl: API_URL,
    frontendUrl: API_URL.includes('staging')
      ? 'https://staging-publisher-tools.webmonetization.workers.dev/tools/'
      : 'https://webmonetization.org/tools/',
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
    widgetPosition: config.widgetPosition
  }

  element.style.position = 'fixed'
  element.style.bottom = '20px'
  element.style.right = '20px'
  element.style.left = '20px'
  element.style.zIndex = '9999'

  return element
}
