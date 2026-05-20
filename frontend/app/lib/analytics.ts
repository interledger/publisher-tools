import { useLocation } from 'react-router'
import { TOOLS, type Tool } from '@shared/types'
import type { ChangedFields } from '~/utils/profile-diff'

// Nest field keys under `changed`
export type SettingsChangedData = { changed: ChangedFields }

export type EventRegistry =
  | [event: 'click_card_tool', data: { link: string }]
  | [event: 'wallet_connected', data: { wallet_provider: string }]
  | [event: 'wallet_disconnected']
  | [event: 'link_tag_generated', data: { wallet_provider: string }]
  | [event: `${Tool}_profile_saved`]
  | [event: `${Tool}_script_generated`]
  | [event: `${Tool}_settings_changed`, data: SettingsChangedData]

export type TrackFn = (...args: EventRegistry) => void

export function useTrackEvent(): TrackFn {
  const { pathname } = useLocation()
  const tool = TOOLS.find((t) => pathname.startsWith(`/${t}`))

  return (...[eventName, eventData]) => {
    window.umami?.track(eventName, { tool, ...eventData })
  }
}

export function trackSettingsEvent(
  trackFn: TrackFn,
  tool: Tool,
  changed: ChangedFields,
): void {
  if (Object.keys(changed).length === 0) return
  trackFn(`${tool}_settings_changed`, { changed })
}
