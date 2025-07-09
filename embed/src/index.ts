import '@tools/components/widget'

/* eslint-disable no-case-declarations */
const FRONTEND_URL = import.meta.env.VITE_SCRIPT_FRONTEND_URL
const API_URL = import.meta.env.VITE_SCRIPT_API_URL

let paramTypes: string[] | undefined,
  paramWallet: string | undefined,
  paramTag: string = 'default',
  urlWallet

// TODO: Have a defined interface for the config
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Config = Record<string, any>

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

const createShadowDOM = () => {
  const shadowHost = document.createElement('div')
  const shadowRoot = shadowHost.attachShadow({ mode: 'open' })

  return { shadowHost, shadowRoot }
}

const appendPaymentPointer = (walletAddressUrl: string) => {
  const monetizationElement = document.createElement('link')
  monetizationElement.rel = 'monetization'
  monetizationElement.href = walletAddressUrl
  document.head.appendChild(monetizationElement)
}

const getCSSFile = async (shadowRoot: ShadowRoot): Promise<HTMLLinkElement> => {
  const link = document.createElement('link')

  link.rel = 'stylesheet'
  link.type = 'text/css'
  link.href = `${FRONTEND_URL}css/banner.css`

  return new Promise((resolve, reject) => {
    link.onload = () => resolve(link)
    link.onerror = () => reject(new Error('Failed to load CSS banner file'))

    shadowRoot.appendChild(link)
  })
}

const allowedFonts = ['Cookie', 'Roboto', 'Open Sans', 'Titillium Web', `Arial`]
const getFontFamily = (family: string, forElement: string = 'banner') => {
  // if exists remove it
  const currentFontFamily = document.getElementById(
    `wmt-font-family-${forElement}`
  ) as HTMLLinkElement
  if (currentFontFamily) {
    currentFontFamily.remove()
  }

  let selectedFont = 'inherit'
  if (allowedFonts.indexOf(family) != -1) {
    selectedFont = family
  }

  // skip injecting of font if set to inherit
  if (selectedFont == 'inherit') {
    return
  }

  const styleObj = document.createElement('link') as HTMLLinkElement
  styleObj.id = `wmt-font-family-${forElement}`
  styleObj.rel = 'stylesheet'
  styleObj.type = 'text/css'

  switch (selectedFont) {
    case 'Open Sans':
      styleObj.href = `https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap`
      break
    case 'Cookie':
      styleObj.href = `https://fonts.googleapis.com/css2?family=Cookie&display=swap`
      break
    case 'Roboto':
      styleObj.href = `https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap`
      break
    default:
      styleObj.href = `https://fonts.googleapis.com/css2?family=Titillium+Web:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700&display=swap`
  }

  return { fontFamily: styleObj, selectedFont }
}

const drawElement = async (
  types: string[] | undefined,
  walletAddress: string,
  config: Config
) => {
  const { shadowHost, shadowRoot } = createShadowDOM()
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
        const font = getFontFamily(config.bannerFontName, 'banner')
        shadowHost.style.setProperty(
          '--wmt-banner-font',
          font?.selectedFont ? font.selectedFont : 'inherit'
        )
        shadowHost.style.setProperty(
          '--wmt-banner-font-size',
          config.bannerFontSize
        )
        document.body.appendChild(shadowHost)
        const element = await drawBanner(config, shadowRoot)
        if (element) {
          shadowRoot.appendChild(element)
        }
        if (font?.fontFamily) {
          // font family needs to be outside of the shadow DOM
          document.body.appendChild(font.fontFamily)
        }
    }
  }
}

const drawBanner = async (config: Config, shadowRoot: ShadowRoot) => {
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

  const element = document.createElement('div')
  element.className = '_wm_tools_banner'

  const position = config.bannerPosition
    ? config.bannerPosition.toLowerCase()
    : 'bottom'
  element.classList.add(`_wm_tools_banner_${position}`)

  if (config.bannerSlideAnimation != 'None') {
    const animation =
      config.bannerSlideAnimation && position == 'top' ? 'down' : 'up'
    element.classList.add(`_wm_tools_banner_${animation}`)
  }

  // custom styles for the element
  element.style.color = config.bannerTextColor
  element.style.backgroundColor = config.bannerBackgroundColor

  const bannerBorder =
    config.bannerBorder == 'Light'
      ? '0.375rem'
      : config.bannerBorder == 'Pill'
        ? '1rem'
        : '0'
  element.style.borderRadius = bannerBorder

  const bannerHeader = document.createElement('div')
  bannerHeader.className = '_wm_tools_banner_header'

  if (config.bannerTitleText) {
    const title = document.createElement('h5')
    const titleText = document.createTextNode(config.bannerTitleText)
    title.appendChild(titleText)
    bannerHeader.appendChild(title)
  } else {
    const emptySpan = document.createElement('span')
    bannerHeader.appendChild(emptySpan)
  }

  const closeButton = document.createElement('span')
  const closeText = document.createTextNode('x')
  closeButton.appendChild(closeText)
  closeButton.addEventListener('click', () => {
    sessionStorage.setItem('_wm_tools_closed_by_user', 'true')
    element.classList.add('_wm_tools_hidden')
  })
  bannerHeader.appendChild(closeButton)
  element.appendChild(bannerHeader)

  // description text
  const descriptionSpan = document.createElement('span')
  const descriptionText = document.createTextNode(config.bannerDescriptionText)
  descriptionSpan.appendChild(descriptionText)
  element.appendChild(descriptionSpan)

  // WebMonetization link
  const linkSpan = document.createElement('span')
  linkSpan.className = '_wm_link'

  const linkElement = document.createElement('a')
  linkElement.rel = 'noindex nofollow'
  linkElement.target = '_blank'
  linkElement.href = getWebMonetizationLinkHref()
  const linkText = document.createTextNode(getWebMonetizationLinkText())
  linkElement.appendChild(linkText)
  linkSpan.appendChild(linkElement)
  element.appendChild(linkSpan)

  await getCSSFile(shadowRoot)

  return element
}

const getWebMonetizationLinkHref = () => {
  const userAgent = navigator.userAgent
  if (userAgent.includes('Firefox')) {
    return 'https://addons.mozilla.org/en-US/firefox/addon/web-monetization-extension/'
  } else if (
    userAgent.includes('Chrome') &&
    !userAgent.includes('Edg') &&
    !userAgent.includes('OPR')
  ) {
    return 'https://chromewebstore.google.com/detail/web-monetization/oiabcfomehhigdepbbclppomkhlknpii'
  } else if (userAgent.includes('Edg')) {
    return 'https://microsoftedge.microsoft.com/addons/detail/web-monetization/imjgemgmeoioefpmfefmffbboogighjl'
  }
  return 'https://webmonetization.org/'
}

const getWebMonetizationLinkText = () => {
  const href = getWebMonetizationLinkHref()
  return href === 'https://webmonetization.org/'
    ? 'Learn more'
    : 'Get the extension'
}

const drawWidget = (walletAddressUrl: string, config: Config) => {
  const element = document.createElement('wm-payment-widget')

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
