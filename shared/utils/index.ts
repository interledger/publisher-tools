import type { WalletAddress } from '@interledger/open-payments'

export function toWalletAddressUrl(s: string): string {
  return s.startsWith('$') ? s.replace('$', 'https://') : s
}

export async function getWalletAddress(
  walletAddressUrl: string
): Promise<WalletAddress> {
  const url = toWalletAddressUrl(walletAddressUrl)

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Unable to fetch wallet details', {
      cause: new Error(res.statusText || `HTTP ${res.status}`)
    })
  }

  try {
    const json: Record<string, unknown> = await res.json()
    if (!isWalletAddress(json)) {
      throw new Error('Invalid wallet address format')
    }
    return json
  } catch (error) {
    throw new Error('Failed to parse wallet address content', { cause: error })
  }
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
