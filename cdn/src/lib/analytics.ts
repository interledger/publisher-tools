import { UMAMI_HOST, UMAMI_WEBSITE_ID } from '@shared/defines'

export type CdnEvent = 'click_link_banner' | 'click_link_offerwall'

let injected = false

export function injectUmami() {
  if (injected || window.umami) return
  if (!UMAMI_HOST || !UMAMI_WEBSITE_ID) return
  injected = true
  const script = document.createElement('script')
  script.src = `${UMAMI_HOST}/script.js`
  script.dataset.websiteId = UMAMI_WEBSITE_ID
  document.head.appendChild(script)
}

export function trackEvent(name: CdnEvent): void {
  injectUmami()
  window.umami?.track(name)
}
