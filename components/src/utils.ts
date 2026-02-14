import type { FontFamilyKey, Tool } from '@shared/types'
import { FONT_MAP } from './constants'

/**
 * Applies the specified font family to an element, removing any existing font link, loading the font if necessary
 * @param element - The HTML element to apply the font to
 * @param fontName - The name of the font family to apply
 * @param componentType - The type of component (for unique font link IDs)
 */
export const applyFontFamily = (
  element: HTMLElement,
  fontName: FontFamilyKey,
  componentType: Tool,
  fontBaseUrl: string,
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
      family: [`'${fontName}'`, ...fontData.fallback].join(', '),
    }
  }
}
