import type { WalletAddress } from '@interledger/open-payments'
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

export function getContrastColor(colorStr: string) {
  // Create a temporary element to let the browser normalize the color to RGB
  const temp = document.createElement('div')
  temp.style.color = colorStr
  document.body.appendChild(temp)
  const rgb = window.getComputedStyle(temp).color.match(/\d+/g)!.map(Number)
  temp.remove()

  const [r, g, b] = rgb
  // YIQ formula
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? '#000000' : '#ffffff'
}

export function getCurrencySymbol(assetCode: string): string {
  const isISO4217Code = (code: string): boolean => {
    return code.length === 3
  }

  if (!isISO4217Code(assetCode)) {
    return assetCode.toUpperCase()
  }
  return new Intl.NumberFormat('en-US', {
    currency: assetCode,
    style: 'currency',
    currencyDisplay: 'symbol',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })
    .format(0)
    .replace(/0/g, '')
    .trim()
}

export function getFormattedAmount(
  value: string | number,
  assetCode: WalletAddress['assetCode'],
  assetScale: WalletAddress['assetScale'],
) {
  const formatterWithCurrency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: assetCode,
    maximumFractionDigits: assetScale,
    minimumFractionDigits: assetScale,
  })
  const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: assetScale,
    minimumFractionDigits: assetScale,
  })

  const amount = Number(formatter.format(Number(`${value}e-${assetScale}`)))
  const amountWithCurrency = formatterWithCurrency.format(
    Number(`${value}e-${assetScale}`),
  )
  const symbol = getCurrencySymbol(assetCode)

  return {
    amount,
    amountWithCurrency,
    symbol,
  }
}
