import type {
  ApiErrorResponse,
  PaymentInitiateInput,
  PaymentInitiateResult,
  PaymentQuoteInput,
  PaymentQuoteResult,
  WalletAddressInfo,
} from 'publisher-tools-api'
import type { Tool, ProfileId, ToolProfile } from '@shared/types'
import { checkHrefFormat, fromAmount, toWalletAddressUrl } from '@shared/utils'

export function getScriptParams(tool: Tool) {
  const script = document.querySelector<HTMLScriptElement>(
    `script#wmt-${tool}-init-script`,
  )
  if (!script) {
    throw new Error(`Could not find ${tool}.js script element.`)
  }
  const cdnUrl = new URL(script.src).origin

  const { walletAddress, walletAddressId, tag } = script.dataset

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

  return { walletAddress, walletAddressId, profileId: tag as ProfileId, cdnUrl }
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

export async function fetchQuote(apiUrl: string, body: PaymentQuoteInput) {
  const url = new URL('/payment/quotes', apiUrl)
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json: PaymentQuoteResult = await res.json()
  if (res.ok && 'receiveAmount' in json) {
    const debitAmount = fromAmount(json.debitAmount)
    const receiveAmount = fromAmount(json.receiveAmount)
    return { debitAmount, receiveAmount }
  }

  if (res.status === 400 && 'error' in json) {
    const { error, minSendAmount } = json
    return {
      error,
      ...(minSendAmount && { minSendAmount: fromAmount(minSendAmount) }),
    }
  } else {
    return {
      error: 'Failed to create payment. Please try a different amount.',
    }
  }
}

export async function initiatePayment(
  apiUrl: string,
  body: PaymentInitiateInput,
) {
  const url = new URL('/payment/initiate', apiUrl).href
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(
      `Failed to initiate payment. HTTP ${res.status} (${res.statusText})`,
    )
  }
  const json: PaymentInitiateResult = await res.json()
  return json
}

export function appendPaymentPointer(walletAddressUrl: string) {
  const monetizationElement = document.createElement('link')
  monetizationElement.rel = 'monetization'
  monetizationElement.href = walletAddressUrl
  document.head.appendChild(monetizationElement)
  return monetizationElement
}
