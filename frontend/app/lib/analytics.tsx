import { createContext, useCallback, useContext } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router'
import { TOOLS } from '@shared/types'

type TrackFn = (eventName: string, eventData?: Record<string, unknown>) => void

const TrackContext = createContext<TrackFn>(() => {})

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const tool = TOOLS.find((t) => pathname.startsWith(`/${t}`))

  const track = useCallback(
    (eventName: string, eventData?: Record<string, unknown>) => {
      window.umami?.track(eventName, tool ? { tool, ...eventData } : eventData)
    },
    [tool],
  )
  return <TrackContext.Provider value={track}>{children}</TrackContext.Provider>
}

export function useTrackEvent(): TrackFn {
  return useContext(TrackContext)
}
