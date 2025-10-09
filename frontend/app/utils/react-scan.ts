import { scan } from 'react-scan'

interface ReactScanOptions {
  enabled?: boolean
  log?: boolean
  includeChildren?: boolean
  onRender?: (fiber: unknown, info: unknown) => void
}

interface ReactScanGlobal {
  start: () => void
  stop: () => void
  toggle: () => void
}

declare global {
  interface Window {
    reactScan?: ReactScanGlobal
  }
}

export async function initReactScan(options: ReactScanOptions = {}) {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  try {
    scan({
      ...options
    })

    if (typeof window !== 'undefined') {
      // global helpers for debugging
      window.reactScan = {
        start: () => scan({ enabled: true }),
        stop: () => scan({ enabled: false }),
        toggle: () => {
          const currentState =
            localStorage.getItem('react-scan-enabled') !== 'false'
          scan({ enabled: !currentState })
          localStorage.setItem('react-scan-enabled', String(!currentState))
        }
      }
    }
  } catch (error) {
    console.warn('Failed to initialize react-scan:', error)
  }
}
