import type { ReactNode } from 'react'
import { useContext, useState, createContext, useEffect, useMemo } from 'react'
import type { SharesState, Share } from '../lib/revshare'
import { validateShares } from '../lib/revshare'
import { generateShareId } from '@shared/utils'

const SHARES_KEY = 'prob-revshare-shares'

interface SharesContextState {
  shares: SharesState
  setShares: (
    shares: SharesState | ((prevShares: SharesState) => SharesState)
  ) => void
}

export const SharesContext = createContext<SharesContextState | undefined>(
  undefined
)
SharesContext.displayName = 'SharesContext'

export function newShare(): Share {
  return {
    id: generateShareId(),
    name: '',
    pointer: '',
    weight: 1
  }
}

export function loadStartingShares(): SharesState {
  try {
    const shareStr =
      typeof window === 'undefined'
        ? undefined
        : localStorage.getItem(SHARES_KEY)
    const parsed = shareStr ? JSON.parse(shareStr) : undefined
    if (parsed && validateShares(parsed)) {
      return parsed as SharesState
    } else {
      return [newShare(), newShare()]
    }
  } catch (e: unknown) {
    if (e instanceof SyntaxError) {
      return [newShare(), newShare()]
    }
    throw e
  }
}

interface SharesProviderProps {
  children: ReactNode
}

export function SharesProvider({ children }: SharesProviderProps) {
  const [shares, _setShares] = useState<SharesState>([])

  useEffect(() => {
    const loadedShares = loadStartingShares()
    _setShares(loadedShares)
  }, [])

  const setShares = (
    newShares: SharesState | ((prevShares: SharesState) => SharesState)
  ) => {
    if (typeof newShares === 'function') {
      _setShares((prevShares) => {
        const result = newShares(prevShares)
        localStorage.setItem(SHARES_KEY, JSON.stringify(result))
        return result
      })
    } else {
      localStorage.setItem(SHARES_KEY, JSON.stringify(newShares))
      _setShares(newShares)
    }
  }

  const value = useMemo(() => ({ shares, setShares }), [shares, setShares])

  return (
    <SharesContext.Provider value={value}>{children}</SharesContext.Provider>
  )
}

export function useShares(): SharesContextState {
  const context = useContext(SharesContext)
  if (!context) {
    throw new Error('useShares must be used within a SharesProvider')
  }
  return context
}
