import type { WalletAddress } from '@interledger/open-payments'

export function toWalletAddressUrl(s: string): string {
  return s.startsWith('$') ? s.replace('$', 'https://') : s
}

export async function getWalletAddress(
  walletAddressUrl: string
): Promise<WalletAddress> {
  const url = toWalletAddressUrl(walletAddressUrl)

  const res = await fetch(toWalletAddressUrl(url))
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
