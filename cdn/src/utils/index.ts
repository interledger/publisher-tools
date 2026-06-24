import type {
  ApiErrorResponse,
  PaymentInitiateInput,
  PaymentInitiateResult,
  PaymentQuoteInput,
  PaymentQuoteResult,
  PaymentValidateInput,
  PaymentValidateResult,
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

export async function probeWalletCompatibility(
  apiUrl: string,
  body: PaymentValidateInput,
): Promise<{ ok: true } | { ok: false; code: 'WALLET_MISMATCH' }> {
  const url = new URL('/payment/validate', apiUrl)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const json: PaymentValidateResult = await res.json()
      if ('compatible' in json && json.compatible) return { ok: true }
      console.warn('Unexpected payment/validate response shape', json)
      return { ok: false, code: 'WALLET_MISMATCH' }
    }
    if (res.status === 400) {
      const json: PaymentValidateResult = await res.json()
      if ('error' in json) return { ok: false, code: json.error }
    }
    console.warn(
      `payment/validate returned HTTP ${res.status} ${res.statusText}`,
    )
    return { ok: false, code: 'WALLET_MISMATCH' }
  } catch (err) {
    console.warn('payment/validate request failed:', err)
    return { ok: false, code: 'WALLET_MISMATCH' }
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

export function isAuthJwt(tokenStr?: string | null): tokenStr is string {
  if (!tokenStr || typeof tokenStr !== 'string') return false
  const parts = tokenStr.split('.')
  if (parts.length !== 3) return false

  const base64UrlRegex = /^[A-Za-z0-9\-_]+$/
  if (!parts.every((part) => base64UrlRegex.test(part))) return false

  const payload = extractJwtPayload(parts[1])
  if (payload) {
    return (
      'sub' in payload &&
      typeof payload.sub === 'string' &&
      'iat' in payload &&
      'auth_time' in payload
    )
  }
  return false
}

// Ensure isAuthJwt is called before using this directly.
export function extractJwtPayload<T extends Record<string, unknown>>(
  payloadBase64Url: string,
) {
  let payload
  try {
    const base64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonString = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    payload = JSON.parse(jsonString)
  } catch {
    return null
  }
  if (typeof payload === 'object' && payload !== null) {
    return payload as T
  }
  return null
}

export function redirect(url: string): never {
  window.location.href = url
  throw 'unreachable'
}

export function isAbortSignalTimeout(ev: unknown) {
  return (
    ev instanceof Event &&
    ev.target instanceof AbortSignal &&
    isTimeoutError(ev.target.reason)
  )
}

export function isTimeoutError(err: unknown) {
  return err instanceof DOMException && err.name === 'TimeoutError'
}
