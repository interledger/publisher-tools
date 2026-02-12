import type { WalletAddress } from '@interledger/open-payments'

export async function getWalletAddress(
  walletAddressUrl: string,
): Promise<WalletAddress> {
  const url = toWalletAddressUrl(walletAddressUrl)

  const response = await fetch(url)
  if (!response.ok) {
    if (response.status === 404) {
      throw new WalletAddressFormatError('This wallet address does not exist')
    }
    throw new WalletAddressFormatError('Unable to fetch wallet details', {
      cause: new WalletAddressFormatError(
        response.statusText || `HTTP ${response.status}`,
      ),
    })
  }

  let json: Record<string, unknown>
  try {
    json = await response.json()
  } catch (error) {
    throw new WalletAddressFormatError(
      'Provided URL is not a valid wallet address',
      {
        cause: error,
      },
    )
  }
  if (!isWalletAddress(json)) {
    throw new WalletAddressFormatError('Invalid wallet address format')
  }

  return json
}

export function isWalletAddress(obj: unknown): obj is WalletAddress {
  if (!obj || typeof obj !== 'object') {
    return false
  }
  const o = obj as Record<string, unknown>
  return !!(
    o.id &&
    typeof o.id === 'string' &&
    o.assetScale &&
    typeof o.assetScale === 'number' &&
    o.assetCode &&
    typeof o.assetCode === 'string' &&
    o.authServer &&
    typeof o.authServer === 'string' &&
    o.resourceServer &&
    typeof o.resourceServer === 'string'
  )
}

// https://github.com/interledger/web-monetization-extension/blob/305b47c9f67ca604c79cfbfb083e5fcd1a579161/src/shared/helpers/wallet.ts#L13-L21
export function toWalletAddressUrl(s: string): string {
  if (s.startsWith('https://')) return s

  const addr = s.replace(/^\$/, 'https://').replace(/\/$/, '')
  if (/^https:\/\/.*\/[^/].*$/.test(addr)) {
    return addr
  }
  return `${addr}/.well-known/pay`
}

export function normalizeWalletAddress(walletAddress: WalletAddress): string {
  const IS_INTERLEDGER_CARDS =
    walletAddress.authServer === 'https://auth.interledger.cards'
  const url = new URL(toWalletAddressUrl(walletAddress.id))
  if (IS_INTERLEDGER_CARDS && url.host === 'ilp.dev') {
    // For Interledger Cards we can have two types of wallet addresses:
    //  - ilp.interledger.cards
    //  - ilp.dev (just a proxy behind ilp.interledger.cards for certain wallet addresses)
    //
    // `ilp.dev` wallet addresses are only used for wallet addresses that are
    // linked to a card.
    //
    // `ilp.interledger.cards` used for the other wallet addresses (user created)
    //
    // Not all `ilp.interledger.cards` wallet addresses can be used with `ilp.dev`.
    // Manually created wallet addresses cannot be used with `ilp.dev`.
    return walletAddress.id.replace('ilp.dev', 'ilp.interledger.cards')
  }
  return walletAddress.id
}

export class WalletAddressFormatError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'WalletAddressFormatError'
  }
}

export function checkHrefFormat(href: string): string {
  let url: URL
  try {
    url = new URL(href)
    if (url.protocol !== 'https:') {
      throw new WalletAddressFormatError(
        'Wallet address must use HTTPS protocol',
      )
    }
  } catch (e) {
    if (e instanceof WalletAddressFormatError) {
      throw e
    }
    throw new WalletAddressFormatError(
      `Invalid wallet address URL: ${JSON.stringify(href)}`,
    )
  }

  const { hash, search, port, username, password } = url

  if (hash || search || port || username || password) {
    throw new WalletAddressFormatError(
      `Wallet address URL must not contain query/fragment/port/username/password elements.`,
    )
  }

  return href
}

type BrowserId = NonNullable<ReturnType<typeof getBrowserSupportForExtension>>
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
  const URL_MAP: Record<BrowserId, string> = {
    chrome: `https://chromewebstore.google.com/detail/web-monetization/oiabcfomehhigdepbbclppomkhlknpii`,
    chromium: `https://chromewebstore.google.com/detail/web-monetization/oiabcfomehhigdepbbclppomkhlknpii`,
    edge: `https://microsoftedge.microsoft.com/addons/detail/web-monetization/imjgemgmeoioefpmfefmffbboogighjl`,
    firefox: `https://addons.mozilla.org/en-US/firefox/addon/web-monetization-extension/`,
    safari: `https://apps.apple.com/app/web-monetization/id6754325288`,
  }

  const url = URL_MAP[browserId]
  return urlWithParams(url, utm || {})
}

export async function fetchWalletDetails(url: string): Promise<WalletAddress> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    if (res.status === 404) {
      throw new WalletAddressFormatError('does not exist')
    }
    throw new WalletAddressFormatError('is not a valid wallet address')
  }
  return await res.json()
}

export async function confirmWalletAddress(
  walletAddress: string,
): Promise<void> {
  const wallet = await fetchWalletDetails(walletAddress)

  if (!isWalletAddress(wallet)) {
    throw new WalletAddressFormatError('does not have a valid wallet response')
  }
}

export const validateWalletAddressOrPointer = (input: string): string => {
  if (!input || typeof input !== 'string') {
    throw new WalletAddressFormatError('is required')
  }

  let urlString = input.trim()
  if (urlString.startsWith('$')) {
    urlString = urlString.replace(/^\$/, 'https://')
  }

  if (!urlString.startsWith('https://')) {
    throw new WalletAddressFormatError('must start with https:// or $')
  }

  if (urlString.includes(' ')) {
    throw new WalletAddressFormatError('must not contain spaces')
  }

  const allowedChars = /^[a-zA-Z0-9\-._~:?#/]+$/
  if (!allowedChars.test(urlString)) {
    throw new WalletAddressFormatError('contains invalid characters')
  }

  let url: URL
  try {
    url = new URL(urlString)
  } catch (err) {
    throw new WalletAddressFormatError('is not a valid URL', { cause: err })
  }

  if (url.protocol !== 'https:') {
    throw new WalletAddressFormatError('must use HTTPS protocol')
  }
  if (!url.hostname) {
    throw new WalletAddressFormatError('must include a domain name')
  }
  if (url.search || url.hash) {
    throw new WalletAddressFormatError(
      'must not contain query string or fragment',
    )
  }
  if (url.pathname && !url.pathname.startsWith('/')) {
    throw new WalletAddressFormatError('path must start with a slash')
  }

  const hostnameRegex =
    /^(?=.{1,253}$)(?!.*\.\.)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)(\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  if (!hostnameRegex.test(url.hostname)) {
    throw new WalletAddressFormatError('domain name is not valid')
  }

  const path = url.pathname === '/' ? '/.well-known/pay' : url.pathname
  return `${url.origin}${path}`
}

export async function validateAndConfirmPointer(url: string): Promise<string> {
  const validUrl = validateWalletAddressOrPointer(url)
  await confirmWalletAddress(validUrl)
  return validUrl
}

/**
 * Polyfill for `Promise.withResolvers()`
 */
export function withResolvers<T>(): {
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
  promise: Promise<T>
} {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  // @ts-expect-error I know, I know
  return { resolve, reject, promise }
}

export type UtmParams = {
  utm_source: string
  utm_medium: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

export function urlWithParams(
  url: string | URL,
  params: Record<string, string>,
): URL {
  const result = new URL(url)
  const searchParams = new URLSearchParams(params)
  for (const [key, val] of searchParams.entries()) {
    result.searchParams.set(key, val)
  }
  return result
}

export function isValidDate(d: unknown): d is Date {
  return d instanceof Date && !isNaN(d.valueOf())
}

export function isValidUrl(v: unknown): v is string {
  if (typeof v !== 'string' || !v) return false

  try {
    const url = new URL(v)
    if (url.protocol !== 'https:') return false
    if (url.pathname.length <= 1) return false
    return true
  } catch {
    return false
  }
}

export function groupBy<T, K extends PropertyKey>(
  items: T[],
  keySelector: (item: T) => K,
): Partial<Record<K, T[]>> {
  const result: Partial<Record<K, T[]>> = {}

  for (const item of items) {
    const key = keySelector(item)
    result[key] ??= []
    result[key]?.push(item)
  }

  return result
}
