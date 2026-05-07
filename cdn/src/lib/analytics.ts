import type { TrackFn } from 'publisher-tools-api'
import { API_URL } from '@shared/defines'

type TrackArgs = Omit<TrackFn, 'url'>

export function trackEvent(event: TrackArgs): void {
  if (!API_URL) return
  // assumes all event names follow 'embed.click_link_<source>'
  const url = `/embed/${event.name.replace('embed.click_link_', '')}`
  // text/plain to avoid CORS preflight on sendBeacon (body is JSON)
  const blob = new Blob(
    [JSON.stringify({ type: 'event', payload: { ...event, url } })],
    { type: 'text/plain' },
  )
  navigator.sendBeacon?.(`${API_URL}/events`, blob)
}
