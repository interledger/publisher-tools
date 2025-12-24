import { createContext, useReducer, type ReactNode } from 'react'

type DialogState = {
  isOpen: boolean
  dialog: ReactNode | null
}

type DialogAction =
  | {
      type: 'OPEN'
      data: {
        isOpen: true
        dialog: ReactNode
      }
    }
  | {
      type: 'CLOSE'
      data: {
        isOpen: false
        dialog: null
      }
    }

const dialogInitialState: DialogState = {
  isOpen: false,
  dialog: null
}

export const DialogContext = createContext<{
  state: DialogState
  dispatch: React.Dispatch<DialogAction>
}>({
  state: dialogInitialState,
  dispatch: () => null
})

const reducer = (state: DialogState, action: DialogAction): DialogState => {
  switch (action.type) {
    case 'OPEN':
      return {
        ...state,
        isOpen: action.data.isOpen,
        dialog: action.data.dialog
      }
    case 'CLOSE':
      return {
        ...state,
        isOpen: action.data.isOpen,
        dialog: action.data.dialog
      }
  }
}

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, dialogInitialState)

  const Dialog = () => {
    if (!state.isOpen) return null
    if (!state.dialog) return null

    return state.dialog
  }

  return (
    <DialogContext.Provider value={{ state, dispatch }}>
      <Dialog />
      {children}
    </DialogContext.Provider>
  )
}
