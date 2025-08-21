import type { WalletAddress } from '@interledger/open-payments'

export async function getWalletAddress(
  walletAddressUrl: string
): Promise<WalletAddress> {
  const url = toWalletAddressUrl(walletAddressUrl)

  const response = await fetch(url)
  if (!response.ok) {
    if (response.status === 404) {
      throw new WalletAddressFormatError('This wallet address does not exist')
    }
    throw new WalletAddressFormatError('Unable to fetch wallet details', {
      cause: new WalletAddressFormatError(
        response.statusText || `HTTP ${response.status}`
      )
    })
  }

  let json: Record<string, unknown>
  try {
    json = await response.json()
  } catch (error) {
    throw new WalletAddressFormatError(
      'Provided URL is not a valid wallet address',
      {
        cause: error
      }
    )
  }
  if (!isWalletAddress(json)) {
    throw new WalletAddressFormatError('Invalid wallet address format')
  }

  return json
}

export function isWalletAddress(
  o: Record<string, unknown>
): o is WalletAddress {
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

export function toWalletAddressUrl(s: string): string {
  return s.startsWith('$') ? s.replace('$', 'https://') : s
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
        'Wallet address must use HTTPS protocol'
      )
    }
  } catch (e) {
    if (e instanceof WalletAddressFormatError) {
      throw e
    }
    throw new WalletAddressFormatError(
      `Invalid wallet address URL: ${JSON.stringify(href)}`
    )
  }

  const { hash, search, port, username, password } = url

  if (hash || search || port || username || password) {
    throw new WalletAddressFormatError(
      `Wallet address URL must not contain query/fragment/port/username/password elements.`
    )
  }

  return href
}

export async function fetchWalletDetails(url: string): Promise<WalletAddress> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' }
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
  walletAddress: string
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
      'must not contain query string or fragment'
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

export function groupBy<T, K extends PropertyKey>(
  items: T[],
  keySelector: (item: T) => K
): Partial<Record<K, T[]>> {
  const result: Partial<Record<K, T[]>> = {}

  for (const item of items) {
    const key = keySelector(item)
    result[key] ??= []
    result[key]?.push(item)
  }

  return result
}
