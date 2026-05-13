import type { EventBody, EventPayload } from 'publisher-tools-api'
import { API_URL } from '@shared/defines'
import type { Tool } from '@shared/types'

type EventData = Omit<EventPayload['data'], 'hostname'>

export function trackEventFactory(tool: Tool) {
  const hostname = window.location.hostname

  return (name: string, data?: EventData): void => {
    if (!API_URL) return
    const body: EventBody = {
      type: 'event',
      payload: {
        name: `embed.${tool}.${name}`,
        url: `/embed/${tool}`,
        data: { hostname, ...data },
      },
    }
    navigator.sendBeacon?.(`${API_URL}/events`, JSON.stringify(body))
  }
}
