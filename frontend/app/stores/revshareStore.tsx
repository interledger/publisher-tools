import { useContext, useState, createContext, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import {
  generateShareId,
  normalizeSharePercentages,
  validateShares,
  type Share,
  type SharesState,
} from '../lib/revshare'

const SHARES_KEY = 'prob-revshare-shares'

interface SharesContextState {
  shares: SharesState
  setShares: (
    shares: SharesState | ((prevShares: SharesState) => SharesState),
  ) => void
}

export const SharesContext = createContext<SharesContextState | undefined>(
  undefined,
)
SharesContext.displayName = 'SharesContext'

export function newShare(percentage = 0): Share {
  return {
    id: generateShareId(),
    name: '',
    pointer: '',
    percentage,
  }
}

function migrateStoredShares(value: unknown): SharesState | undefined {
  if (!Array.isArray(value)) return undefined

  let hasLegacyWeights = false
  const shares: Share[] = []
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') return undefined
    const stored = entry as Record<string, unknown>
    if (typeof stored.id !== 'string' || typeof stored.pointer !== 'string') {
      return undefined
    }

    const usesLegacyWeight =
      stored.percentage === undefined && typeof stored.weight === 'number'
    hasLegacyWeights ||= usesLegacyWeight
    const percentage = Number(
      usesLegacyWeight ? stored.weight : stored.percentage,
    )
    if (!Number.isFinite(percentage)) return undefined

    shares.push({
      id: stored.id,
      name: typeof stored.name === 'string' ? stored.name : '',
      pointer: stored.pointer,
      percentage,
      isValid: stored.isValid === true,
    })
  }

  return hasLegacyWeights ? normalizeSharePercentages(shares) : shares
}

export function loadStartingShares(): SharesState {
  try {
    const shareStr =
      typeof window === 'undefined'
        ? undefined
        : localStorage.getItem(SHARES_KEY)
    const parsed = shareStr ? JSON.parse(shareStr) : undefined
    const migrated = migrateStoredShares(parsed)
    if (migrated && validateShares(migrated)) {
      return migrated
    } else {
      return [newShare(50), newShare(50)]
    }
  } catch (e: unknown) {
    if (e instanceof SyntaxError) {
      return [newShare(50), newShare(50)]
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
    newShares: SharesState | ((prevShares: SharesState) => SharesState),
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
