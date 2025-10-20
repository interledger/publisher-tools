import type { FontFamilyKey } from '@shared/types'
import { FONT_MAP } from './constants'
import type {
  PaymentStatus,
  PaymentStatusRejected,
  PaymentStatusSuccess
} from 'publisher-tools-api'

/**
 * Applies the specified font family to an element, removing any existing font link, loading the font if necessary
 * @param element - The HTML element to apply the font to
 * @param fontName - The name of the font family to apply
 * @param componentType - The type of component (for unique font link IDs)
 */
export const applyFontFamily = (
  element: HTMLElement,
  fontName: FontFamilyKey,
  componentType: 'banner' | 'widget',
  fontBaseUrl: string
): void => {
  const fontLinkId = `wmt-font-family-${componentType}`
  const existingFont = document.getElementById(fontLinkId) as HTMLLinkElement

  if (existingFont) {
    existingFont.remove()
  }

  if (fontName === 'Inherit') {
    element.style.setProperty('--wm-font-family', 'inherit')
    return
  }

  if (fontName === 'Arial') {
    element.style.setProperty('--wm-font-family', fontName)
    return
  }

  const customFontData = getCustomFontData(fontName, fontBaseUrl)
  if (!customFontData) {
    element.style.setProperty('--wm-font-family', 'inherit')
    return
  }

  const fontLink = document.createElement('link') as HTMLLinkElement
  fontLink.id = fontLinkId
  fontLink.rel = 'stylesheet'
  fontLink.type = 'text/css'
  fontLink.href = customFontData.url
  document.head.appendChild(fontLink)

  element.style.setProperty('--wm-font-family', customFontData.family)
}

function getCustomFontData(fontName: FontFamilyKey, baseUrl: string) {
  const fontData = FONT_MAP.get(fontName)
  if (fontData) {
    return {
      url: baseUrl + fontData.fileName,
      family: [`'${fontName}'`, ...fontData.fallback].join(', ')
    }
  }
}

/**
 * Gets the appropriate Web Monetization extension download link based on the user agent
 * @param userAgent - The user agent string from navigator.userAgent
 * @returns The download URL for the Web Monetization extension
 */
export const getWebMonetizationLinkHref = (userAgent: string): string => {
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

export function isInteractionSuccess(
  params: PaymentStatus
): params is PaymentStatusSuccess {
  return 'interact_ref' in params
}

export function isInteractionRejected(
  params: PaymentStatus
): params is PaymentStatusRejected {
  return 'result' in params && params.result === 'grant_rejected'
}
