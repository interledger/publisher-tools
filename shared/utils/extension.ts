import type { Tool, UtmParams } from '@shared/types'
import { urlWithParams } from './index'

type BrowserId = NonNullable<ReturnType<typeof getBrowserSupportForExtension>>

const URL_MAP: Record<BrowserId, string> = {
  chrome: `https://chromewebstore.google.com/detail/web-monetization/oiabcfomehhigdepbbclppomkhlknpii`,
  chromium: `https://chromewebstore.google.com/detail/web-monetization/oiabcfomehhigdepbbclppomkhlknpii`,
  edge: `https://microsoftedge.microsoft.com/addons/detail/web-monetization/imjgemgmeoioefpmfefmffbboogighjl`,
  firefox: `https://addons.mozilla.org/en-US/firefox/addon/web-monetization-extension/`,
  safari: `https://apps.apple.com/app/web-monetization/id6754325288`,
}

export function getBrowserSupportForExtension(ua: string, vendor = '') {
  const isMobile =
    /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ||
    (navigator.maxTouchPoints > 0 && /Macintosh/.test(ua))
  const isMacOS = /Macintosh/i.test(ua) && !isMobile

  // Firefox (Desktop & Android supported, iOS excluded)
  if (/Firefox/i.test(ua) && !/FxiOS/i.test(ua)) {
    return 'firefox' // Both Desktop and Android
  }

  // Safari (macOS supported, iOS/iPadOS excluded)
  if (
    /Safari/i.test(ua) &&
    /Apple Computer/i.test(vendor) &&
    !/Chrome|CriOS|Android/i.test(ua)
  ) {
    if (isMacOS) {
      return 'safari'
    } else {
      return null // Identified as Safari, but on mobile/iPad
    }
  }

  // Chromium-based Browsers
  // Chromium Rule: Supported on Desktop Only
  // (Excludes Chrome Android, Chrome iOS, Edge Mobile, etc.)
  if (/Chrome|CriOS|Edg|Vivaldi|Opr|Brave/i.test(ua)) {
    // Determine the specific flavor
    if (/Edg/i.test(ua)) {
      return isMobile ? null : 'edge'
    } else if (/Vivaldi/i.test(ua) || /Opr/i.test(ua) || /Brave/i.test(ua)) {
      return isMobile ? null : 'chromium'
    } else {
      return isMobile ? null : 'chrome'
    }
  }

  return null
}

export function getExtensionUrl(browserId: BrowserId, utm?: UtmParams): URL {
  const url = URL_MAP[browserId]
  return urlWithParams(url, utm || {})
}

export function getExtensionHref(
  tool: Tool,
  options?: Partial<{ fallbackUrl: string; utm: UtmParams }>,
): string {
  const utm: UtmParams = {
    utm_source: window.location.hostname,
    utm_medium: `tools.embed.${tool}`,
    ...options?.utm,
  }
  const fallbackUrl = options?.fallbackUrl || 'https://webmonetization.org'

  const browserId = getBrowserSupportForExtension(
    navigator.userAgent,
    navigator.vendor,
  )
  if (!browserId) {
    console.warn('Using on browser that does not have WM extension support')
    return urlWithParams(fallbackUrl, utm).href
  }
  return getExtensionUrl(browserId, utm).href
}

export function isExtensionInstalled(): boolean {
  return (
    'MonetizationEvent' in window &&
    typeof window.MonetizationEvent !== 'undefined'
  )
}
