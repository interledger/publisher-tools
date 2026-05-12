import type { TrackPayload } from 'publisher-tools-api'
import { API_URL } from '@shared/defines'

type TrackArgs = {
  name: TrackPayload['name']
  data?: Omit<TrackPayload['data'], 'hostname'>
}

export function trackEvent({ name, data }: TrackArgs): void {
  if (!API_URL) return
  // assumes all event names follow 'embed.click_link_<source>'
  const url = `/embed/${name.replace('embed.click_link_', '')}`
  const hostname = window.location.hostname
  // text/plain to avoid CORS preflight on sendBeacon (body is JSON)
  const blob = new Blob(
    [
      JSON.stringify({
        type: 'event',
        payload: { name, url, data: { hostname, ...data } },
      }),
    ],
    { type: 'text/plain' },
  )
  navigator.sendBeacon?.(`${API_URL}/events`, blob)
}
