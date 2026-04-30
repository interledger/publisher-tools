import { API_URL } from '@shared/defines'

export type CdnEvent = 'click_link_banner' | 'click_link_offerwall'

export function trackEvent(name: CdnEvent): void {
  if (!API_URL) return
  const blob = new Blob([JSON.stringify({ name })], { type: 'text/plain' })
  navigator.sendBeacon?.(`${API_URL}/events`, blob)
}
