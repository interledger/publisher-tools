import React, { createContext, useContext, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'

type UIState = Record<string, never>

interface WalletInputRef {
  focus: () => void
}

interface UIActions {
  focusWalletInput: () => void
  registerWalletInput: (ref: WalletInputRef) => void
  unregisterWalletInput: () => void
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

  const focusWalletInput = useCallback(() => {
    setTimeout(() => {
      // small delay to ensure DOM is ready (e.g., modal is closed)
      walletInputRef.current?.focus()
    }, 100)
  }, [])

  const registerWalletInput = useCallback((ref: WalletInputRef) => {
    walletInputRef.current = ref
  }, [])

  const unregisterWalletInput = useCallback(() => {
    walletInputRef.current = null
  }, [])

  const state: UIState = {}

  const actions: UIActions = {
    focusWalletInput,
    registerWalletInput,
    unregisterWalletInput
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
