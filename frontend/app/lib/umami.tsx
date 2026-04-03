import { createContext, useCallback, useContext } from 'react'
import type { ReactNode } from 'react'
import type { Tool } from '@shared/types'

type TrackFn = (eventName: string, eventData?: Record<string, unknown>) => void

const TrackContext = createContext<TrackFn>(() => {})

export function TelemetryProvider({
  tool,
  children,
}: {
  tool?: Tool
  children: ReactNode
}) {
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
