import type {
  AuthInput,
  AuthResponse,
  PaywallEntitlementResult,
  PaywallPaymentStatus,
  WalletAddressInfo,
} from 'publisher-tools-api'
import type { Actions } from '@c/paywall/controller'
import { API_URL } from '@shared/defines'
import { sleep, urlWithParams } from '@shared/utils'
import { Paywall } from '@tools/components'
import {
  extractJwtPayload,
  fetchProfile,
  getScriptParams,
  getWallet,
  initiatePayment,
  isAbortSignalTimeout,
  isAuthJwt,
  isTimeoutError,
  redirect,
} from './utils'

const NAME = 'wm-paywall'
customElements.define(NAME, Paywall)

const params = getScriptParams('paywall')

function main() {
  const paramsFromUrl = handlePageUrlOnLoad()
  if (paramsFromUrl.token) {
    // Used with future checkEntitlement requests
    storage.authJwt.set(paramsFromUrl.token)
  }

  const price = params.otherAttributes.price?.trim()
  if (price && !/^\d+(\.\d+)?$/.test(price)) {
    throw new Error(`Invalid data-price="${price}"`)
  }

  const pageUrl = window.location.href

  const element = document.createElement('wm-paywall')
  if (price) element.setPrice(price)
  const actions = element.setController({
    receiverWalletAddressUrl: params.walletAddress,
    senderWalletAddressUrl: storage.authJwt.getWalletAddress(),
    cdnUrl: params.cdnUrl,
    fetchConfig: () => fetchProfile(API_URL, 'paywall', params),
    async checkEntitlement(walletAddress) {
      console.debug('checkEntitlement', { walletAddress })
      const token = storage.authJwt.get()
      if (!walletAddress && !token) {
        return { entitlement: 'no-access' }
      }
      const url = urlWithParams(new URL('/paywall/entitlement', API_URL), {
        url: pageUrl,
        ...(walletAddress && {
          wa: walletAddress.id,
          $wa: walletAddress.$url,
        }),
      })
      const res = await fetch(url, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      })
      const data: PaywallEntitlementResult = await res.json()

      if (data.token) {
        storage.authJwt.set(data.token)
      }

      return { entitlement: data.entitlement, paymentId: data.paymentId }
    },
    async authenticate(walletAddress) {
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
    remove(el) {
      el.remove()
    },
    getWallet: (walletAddressUrl) => getWallet(API_URL, walletAddressUrl),
    async initiatePayment({ sender, receiver, amount, note }) {
      const receiveAmount = Number(amount)
      // When a grant accept request redirects to this URL, the backend stores
      // payment details in DB, and sends user back to `pageUrl`.
      const redirectUrl = urlWithParams(new URL('/paywall/callback', API_URL), {
        next: pageUrl,
      }).href
      const res = await initiatePayment(API_URL, {
        sender,
        receiver,
        receiveAmount,
        note,
        redirectUrl,
      })
      if (res.grantRedirectUrl) {
        storage.postPayment.set(pageUrl, { sender, paymentId: res.paymentId })
        redirect(res.grantRedirectUrl)
      }
      return res
    },
    async *getStatus(paymentId, signal) {
      const url = new URL(`/paywall/payment-status/${paymentId}`, API_URL).href
      while (true) {
        try {
          signal?.throwIfAborted()
          const res = await fetch(url, { signal })
          if (!res.ok) {
            throw new Error(`Payment status check failed: HTTP ${res.status}`)
          }

          const status: PaywallPaymentStatus = await res.json()
          yield status

          if (status.type === 'PENDING_GRANT_INTERACTION') {
            await sleep(3000)
          } else if (status.type === 'PAYMENT_CREATED') {
            await sleep(1500)
          } else if (
            status.type === 'PAYMENT_DONE' ||
            status.type === 'GRANT_REJECTED'
          ) {
            storage.postPayment.delete(pageUrl)
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

  handlePageLoad(pageUrl, paramsFromUrl, actions)
  document.body.appendChild(element)
}

function handlePageUrlOnLoad() {
  const url = new URL(window.location.href)
  const params = Object.fromEntries([...url.searchParams])

  type PotentialUrlParams = 'token' | 'paymentId' | 'result' | 'reason'
  const res: Partial<Record<PotentialUrlParams, string>> = {}

  if (isAuthJwt(params.token)) {
    res.token = params.token
    url.searchParams.delete('token')
  }
  if (params.paymentId) {
    res.paymentId = params.paymentId
    url.searchParams.delete('paymentId')
  }
  if (params.result) {
    res.result = params.result
    url.searchParams.delete('result')
  }
  if (params.reason) {
    // Set when result=failure typically
    res.reason = params.reason
    url.searchParams.delete('reason')
  }

  if (window.location.href !== url.href) {
    window.history.replaceState(null, '', url.href)
  }

  console.debug('handlePageUrlOnLoad', res)
  return res
}

type PageLoadParams = ReturnType<typeof handlePageUrlOnLoad>

function handlePageLoad(
  pageUrl: string,
  params: PageLoadParams,
  actions: Actions,
) {
  const stored = storage.postPayment.get(pageUrl)
  // must be set during initiatePayment; is removed on failure/completion
  if (!stored) return

  // params are empty after page reload (available only on first load)
  if (params.result === 'failure') {
    storage.postPayment.delete(pageUrl)
    return
  }

  const { sender, paymentId } = stored
  actions.setView('verify', { sender, paymentId })
}

const storage = {
  authJwt: {
    set(token: string) {
      window.localStorage.setItem('ilpt:wallet-address-auth', token)
    },
    get() {
      const stored = window.localStorage.getItem('ilpt:wallet-address-auth')
      return isAuthJwt(stored) ? stored : null
    },
    getWalletAddress(token?: string | null) {
      type JwtPayload = { sub: string; waUrl?: string }
      token ||= this.get()
      if (!token) return null
      const payload = extractJwtPayload<JwtPayload>(token.split('.')[1])
      return payload?.waUrl || payload?.sub || null
    },
  },
  postPayment: {
    set(
      pageUrl: string,
      data: { sender: WalletAddressInfo; paymentId: string },
    ) {
      window.localStorage.setItem(
        `wmt-paywall-payment:${pageUrl}`,
        JSON.stringify({ data, ts: Date.now() }),
      )
    },
    get(pageUrl: string) {
      const stored = window.localStorage.getItem(
        `wmt-paywall-payment:${pageUrl}`,
      )
      if (!stored) return null

      try {
        const parsed = JSON.parse(stored)
        if (!parsed.ts || !parsed.data?.sender || !parsed.data?.paymentId) {
          throw new Error('Invalid stored data')
        }
        const MAX_AGE_MS = 2 * 60 * 60 * 1000
        if (Date.now() - parsed.ts > MAX_AGE_MS) {
          // don't trust too stale data
          this.delete(pageUrl)
          return null
        }
        return {
          sender: parsed.data.sender as WalletAddressInfo,
          paymentId: parsed.data.paymentId as string,
        }
      } catch {
        return null
      }
    },
    delete(pageUrl: string) {
      window.localStorage.removeItem(`wmt-paywall-payment:${pageUrl}`)
    },
  },
}

main()
