import { FONT_FAMILY_URLS } from '@shared/types'
import type { FontFamilyKey } from '@shared/types'

/**
 * Applies the specified font family to an element, removing any existing font link, loading the font if necessary
 * @param element - The HTML element to apply the font to
 * @param fontName - The name of the font family to apply
 * @param componentType - The type of component (for unique font link IDs)
 */
export const applyFontFamily = (
  element: HTMLElement,
  fontName: FontFamilyKey,
  componentType: 'banner' | 'widget' = 'banner'
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

  const fontFamilyUrl = FONT_FAMILY_URLS[fontName]
  if (!fontFamilyUrl) {
    element.style.setProperty('--wm-font-family', 'inherit')
    return
  }

  const fontLink = document.createElement('link') as HTMLLinkElement
  fontLink.id = fontLinkId
  fontLink.rel = 'stylesheet'
  fontLink.type = 'text/css'
  fontLink.href = fontFamilyUrl
  document.head.appendChild(fontLink)

  element.style.setProperty('--wm-font-family', fontName)
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
