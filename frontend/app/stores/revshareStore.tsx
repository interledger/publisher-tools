import React, { useContext, useState, createContext, ReactNode, useEffect } from 'react'
import { validateShares, SharesState, Share } from '../lib/revshare'

const SHARES_KEY = 'prob-revshare-shares'


interface SharesContextState {
  shares: SharesState
  setShares: (shares: SharesState) => void
}

export const SharesContext = createContext<SharesContextState | undefined>(undefined)
SharesContext.displayName = 'SharesContext'

/**
 * Create a new empty share
 */
export function newShare(): Share {
  return {
    name: '',
    pointer: '',
    weight: 1
  }
}

/**
 * Load shares from localStorage or initialise with a default share
 */
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
      return [newShare()]
    }
  } catch (e: any) {
    if (e.name === 'SyntaxError') {
      return [newShare()]
    } else {
      throw e
    }
  }
}

/**
 * SharesProvider component
 */
interface SharesProviderProps {
  children: ReactNode
}

export function SharesProvider({ children }: SharesProviderProps) {
  const [shares, _setShares] = useState<SharesState>([])

  useEffect(() => {
    const loadedShares = loadStartingShares()
    _setShares(loadedShares)
  }, [])

  const setShares = (newShares: SharesState) => {
    localStorage.setItem(SHARES_KEY, JSON.stringify(newShares))
    _setShares(newShares)
  }

  const value: SharesContextState = { shares, setShares }


  return (
    <SharesContext.Provider value={value}>
      {children}
    </SharesContext.Provider>
  )
}

/**
 * Hook to use shares context
 */
export function useShares(): SharesContextState {
  const context = useContext(SharesContext)
  if (!context) {
    throw new Error('useShares must be used within a SharesProvider')
  }
  return context
}
