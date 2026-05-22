import type {
  AuthInput,
  AuthResponse,
  PaymentStatus,
} from 'publisher-tools-api'
import { API_URL } from '@shared/defines'
import { sleep } from '@shared/utils'
import { Paywall } from '@tools/components'
import {
  fetchProfile,
  getScriptParams,
  getWallet,
  initiatePayment,
  redirect,
} from './utils'

const NAME = 'wm-paywall'
customElements.define(NAME, Paywall)

const params = getScriptParams('paywall')

drawPaywall()
function drawPaywall() {
  const price = params.otherAttributes.price?.trim()
  if (price && !/^\d+(\.\d+)?$/.test(price)) {
    throw new Error(`Invalid data-price="${price}"`)
  }

  const element = document.createElement('wm-paywall')
  if (price) element.setPrice(price)
  element.setController({
    receiverWalletAddressUrl: params.walletAddress,
    cdnUrl: params.cdnUrl,
    fetchConfig: () => fetchProfile(API_URL, 'paywall', params),
    async checkEntitlement() {
      return 'auth-required' // TODO: create and call API
    },
    async saveEntitlement() {
      // TODO: create and call API
    },
    async authenticate(walletAddress) {
      const pageUrl = window.location.origin + window.location.pathname // TODO: use from other PR
      const url = new URL('/auth', API_URL).href
      const body: AuthInput = { walletAddress, next: pageUrl }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        throw new Error(`Authenticate failed: HTTP ${res.status}`)
      }
      const data: AuthResponse = await res.json()
      redirect(data.grantRedirectUrl)
    },
    getWallet: (walletAddressUrl) => getWallet(API_URL, walletAddressUrl),
    async initiatePayment({ sender, receiver, amount, note }) {
      const receiveAmount = Number(amount)
      const redirectUrl = window.location.href
      return initiatePayment(API_URL, {
        sender,
        receiver,
        receiveAmount,
        note,
        redirectUrl,
      })
    },
    async *getStatus(paymentId, signal) {
      const url = new URL(`/payment/status/${paymentId}`, API_URL).href
      while (true) {
        try {
          signal?.throwIfAborted()
          const res = await fetch(url, { signal })
          if (!res.ok) {
            throw new Error('Failed to check payment status: ' + res.statusText)
          }

          const status: PaymentStatus = await res.json()
          yield status

          if (status.type === 'PENDING_GRANT_INTERACTION') {
            await sleep(3000)
          } else if (status.type === 'OUTGOING_PAYMENT_CREATED') {
            await sleep(1500)
          } else if (
            status.type === 'OUTGOING_PAYMENT_DONE' ||
            status.type === 'GRANT_REJECTED'
          ) {
            break
          } else {
            throw new Error('Unknown payment status: ' + JSON.stringify(status))
          }
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            break
          } else if (isAbortSignalTimeout(err) || isTimeoutError(err)) {
            throw new Error('Payment authorization timed out')
          } else {
            throw new Error('Failed to check payment status', { cause: err })
          }
        }
      }
    },
  })

  const pageLoadParams = handlePageLoad()
  console.log(pageLoadParams)

  document.body.appendChild(element)
}

function handlePageLoad() {
  const url = new URL(window.location.href)
  const params = Object.fromEntries([...url.searchParams])

  const result: Partial<Record<'token' | 'paymentId' | 'result', string>> = {}

  if (isAuthJwt(params.token)) {
    result.token = params.token
    // Used with future checkEntitlement requests
    window.localStorage.setItem(`wmt-paywall:auth`, params.token)
    url.searchParams.delete('token')
  }
  if (params.paymentId) {
    result.paymentId = params.paymentId
    url.searchParams.delete('paymentId')
  }
  if (params.result) {
    result.result = params.result
    url.searchParams.delete('result')
  }
  if (window.location.href !== url.href) {
    window.history.replaceState(null, '', url.href)
  }

  return result
}

function isAuthJwt(tokenStr: string): boolean {
  if (!tokenStr || typeof tokenStr !== 'string') return false
  const parts = tokenStr.split('.')
  if (parts.length !== 3) return false

  const base64UrlRegex = /^[A-Za-z0-9\-_]+$/
  if (!parts.every((part) => base64UrlRegex.test(part))) return false

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const jsonString = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    const payload = JSON.parse(jsonString)
    if (typeof payload === 'object' && payload !== null) {
      return 'sub' in payload && 'iat' in payload && 'auth_time' in payload
    }
  } catch {
    return false
  }
  return false
}

function isAbortSignalTimeout(ev: unknown) {
  return (
    ev instanceof Event &&
    ev.target instanceof AbortSignal &&
    isTimeoutError(ev.target.reason)
  )
}

function isTimeoutError(err: unknown) {
  return err instanceof DOMException && err.name === 'TimeoutError'
}
