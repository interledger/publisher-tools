import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useState,
  useEffect
} from 'react'
import type { ReactNode } from 'react'

type UIState = {
  contentComplete: boolean
  appearanceComplete: boolean
}

interface WalletInputRef {
  focus: () => void
}

interface UIActions {
  focusWalletInput: () => void
  registerWalletInput: (ref: WalletInputRef) => () => void
  setContentComplete: (complete: boolean) => void
  setAppearanceComplete: (complete: boolean) => void
}

interface UIContextType {
  state: UIState
  actions: UIActions
}

const UIContext = createContext<UIContextType | undefined>(undefined)

interface UIProviderProps {
  children: ReactNode
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const walletInputRef = useRef<WalletInputRef | null>(null)
  const [shouldFocusWallet, setShouldFocusWallet] = useState(false)
  const [contentComplete, setContentComplete] = useState(false)
  const [appearanceComplete, setAppearanceComplete] = useState(false)

  useEffect(() => {
    if (shouldFocusWallet && walletInputRef.current) {
      walletInputRef.current.focus()
      setShouldFocusWallet(false)
    }
  }, [shouldFocusWallet])

  const focusWalletInput = useCallback(() => {
    setShouldFocusWallet(true)
  }, [])

  const registerWalletInput = useCallback((ref: WalletInputRef) => {
    walletInputRef.current = ref

    return () => {
      walletInputRef.current = null
    }
  }, [])

  const state: UIState = {
    contentComplete,
    appearanceComplete
  }

  const actions: UIActions = {
    focusWalletInput,
    registerWalletInput,
    setContentComplete,
    setAppearanceComplete
  }

  return (
    <UIContext.Provider value={{ state, actions }}>
      {children}
    </UIContext.Provider>
  )
}

export const useUI = (): UIContextType => {
  const context = useContext(UIContext)
  if (!context) {
    throw new Error('useUI must be used within a UIProvider')
  }
  return context
}
