import type { TrackPayload } from 'publisher-tools-api'
import { API_URL } from '@shared/defines'
import type { Tool } from '@shared/types'

type TrackArgs = {
  name: string
  data?: Omit<TrackPayload['data'], 'hostname'>
}

export function trackEventFactory(tool: Tool) {
  const hostname = window.location.hostname

  return ({ name, data }: TrackArgs): void => {
    if (!API_URL) return
    navigator.sendBeacon?.(
      `${API_URL}/events`,
      JSON.stringify({
        type: 'event',
        payload: {
          name: `embed.${tool}.${name}`,
          url: `/embed/${tool}`,
          data: { hostname, ...data },
        },
      }),
    )
  }
}
