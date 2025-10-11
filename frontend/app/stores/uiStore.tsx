import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useState,
  useEffect,
  useMemo
} from 'react'
import type { ReactNode } from 'react'

type UIState = {
  contentComplete: boolean
  appearanceComplete: boolean
  activeSection: 'content' | 'appearance' | null
  buildStepComplete: boolean
}

interface WalletInputRef {
  focus: () => void
}

interface UIActions {
  focusWalletInput: () => void
  registerWalletInput: (ref: WalletInputRef) => () => void
  setContentComplete: (complete: boolean) => void
  setAppearanceComplete: (complete: boolean) => void
  setActiveSection: (section: UIState['activeSection']) => void
}

const UIStateContext = createContext<UIState | undefined>(undefined)
const UIActionsContext = createContext<UIActions | undefined>(undefined)

interface UIProviderProps {
  children: ReactNode
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const walletInputRef = useRef<WalletInputRef | null>(null)
  const [shouldFocusWallet, setShouldFocusWallet] = useState(false)
  const [contentComplete, setContentComplete] = useState(false)
  const [appearanceComplete, setAppearanceComplete] = useState(false)
  const [activeSection, setActiveSection] =
    useState<UIState['activeSection']>(null)
  const buildStepComplete = contentComplete && appearanceComplete

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
    activeSection,
    appearanceComplete,
    buildStepComplete
  }

  const actions: UIActions = useMemo(
    () => ({
      focusWalletInput,
      registerWalletInput,
      setContentComplete,
      setAppearanceComplete,
      setActiveSection
    }),
    [
      focusWalletInput,
      registerWalletInput,
      setContentComplete,
      setAppearanceComplete,
      setActiveSection
    ]
  )

  return (
    <UIStateContext.Provider value={state}>
      <UIActionsContext.Provider value={actions}>
        {children}
      </UIActionsContext.Provider>
    </UIStateContext.Provider>
  )
}

export const useUIActions = (): UIActions => {
  const context = useContext(UIActionsContext)
  if (!context) {
    throw new Error('useUIActions must be used within a UIProvider')
  }
  return context
}

export const useUIState = (): UIState => {
  const state = useContext(UIStateContext)
  if (!state) {
    throw new Error('useUIState must be used within a UIProvider')
  }
  return state
}
