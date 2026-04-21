import { createContext, useCallback, useContext } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router'
import { TOOLS } from '@shared/types'
import type { ToolsEventMap } from '~/lib/analytics-events'

export type TrackFn = <E extends keyof ToolsEventMap>(
  ...args: ToolsEventMap[E] extends undefined
    ? [eventName: E]
    : [eventName: E, data: ToolsEventMap[E]]
) => void

const TrackContext = createContext<TrackFn>(() => {})

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const tool = TOOLS.find((t) => pathname.startsWith(`/${t}`))

  const track = useCallback(
    ((eventName, eventData) => {
      window.umami?.track(eventName, { ...(tool && { tool }), ...eventData })
    }) as TrackFn,
    [tool],
  )

  return <TrackContext.Provider value={track}>{children}</TrackContext.Provider>
}

export function useTrackEvent(): TrackFn {
  return useContext(TrackContext)
}
