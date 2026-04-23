import { UMAMI_HOST, UMAMI_WEBSITE_ID } from '@shared/defines'

type ExtensionLinkSource = 'banner' | 'offerwall'
type ClickLinkEvent = `click_link_${ExtensionLinkSource}`

export type CdnEventMap = {
  [K in ClickLinkEvent]: undefined
}

type TrackArgs<E extends keyof CdnEventMap> = CdnEventMap[E] extends undefined
  ? [eventName: E]
  : [eventName: E, data: CdnEventMap[E]]

let umamiInjected = false

/**
 * Appended the Umami tracker script so it's loaded before any
 * trackEvent() call fires (avoids a race on the first user interaction).
 */
export function injectUmami() {
  if (!UMAMI_HOST || !UMAMI_WEBSITE_ID) return
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (window.umami || umamiInjected) return

  umamiInjected = true
  const script = document.createElement('script')
  script.defer = true
  script.src = `${UMAMI_HOST}/script.js`
  script.setAttribute('data-website-id', UMAMI_WEBSITE_ID)
  document.head.appendChild(script)
}

export function trackEvent<E extends keyof CdnEventMap>(
  ...args: TrackArgs<E>
): void {
  const [eventName, data] = args as [E, CdnEventMap[E] | undefined]
  injectUmami()
  window.umami?.track(eventName, data)
}
