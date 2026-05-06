import type { ApiErrorResponse, WalletAddressInfo } from 'publisher-tools-api'
import type { Tool, ProfileId, ToolProfile } from '@shared/types'
import { checkHrefFormat, toWalletAddressUrl } from '@shared/utils'

export function getScriptParams(tool: Tool) {
  const script = document.querySelector<HTMLScriptElement>(
    `script#wmt-${tool}-init-script`,
  )
  if (!script) {
    throw new Error(`Could not find ${tool}.js script element.`)
  }
  const cdnUrl = new URL(script.src).origin

  const { walletAddress, walletAddressId, tag, ...rest } = script.dataset

  if (!walletAddress) {
    throw new Error(`Missing data-wallet-address for ${tool}.js script`)
  }
  try {
    void new URL(walletAddress)
  } catch {
    throw new Error(
      `Invalid data-wallet-address for ${tool}.js script: ${walletAddress}`,
    )
  }
  if (walletAddressId) {
    try {
      void new URL(walletAddressId)
    } catch {
      throw new Error(
        `Invalid data-wallet-address-id for ${tool}.js script: ${walletAddressId}`,
      )
    }
  }

  if (!tag) {
    throw new Error(`Missing data-tag for ${tool}.js script`)
  }

  return {
    walletAddress,
    walletAddressId,
    profileId: tag as ProfileId,
    cdnUrl,
    otherAttributes: rest,
  }
}

export async function fetchProfile<T extends Tool>(
  apiUrl: string,
  tool: T,
  params: ReturnType<typeof getScriptParams>,
): Promise<ToolProfile<T>> {
  const url = new URL(`profile/${tool}`, apiUrl)
  url.searchParams.set('wa', params.walletAddressId || params.walletAddress)
  url.searchParams.set('id', params.profileId)

  const res = await fetch(url)
  if (!res.ok && res.status !== 404) {
    throw new Error(
      `Failed to fetch config: HTTP ${res.status} ${res.statusText}`,
    )
  }

  const json = await res.json()
  return json as ToolProfile<T>
}

export async function getWallet(
  apiUrl: string,
  walletAddressUrl: string,
): Promise<WalletAddressInfo> {
  walletAddressUrl = checkHrefFormat(toWalletAddressUrl(walletAddressUrl))

  const url = new URL('/wallet', apiUrl)
  url.searchParams.set('walletAddress', walletAddressUrl)

  const response = await fetch(url)
  const data = await response.json()
  if (!response.ok) {
    throw new Error((data as ApiErrorResponse).error?.message)
  }
  return data as WalletAddressInfo
}

export function appendPaymentPointer(walletAddressUrl: string) {
  const monetizationElement = document.createElement('link')
  monetizationElement.rel = 'monetization'
  monetizationElement.href = walletAddressUrl
  document.head.appendChild(monetizationElement)
  return monetizationElement
}
