import { createContext } from 'react'
import type { DialogState, DialogAction } from '~/lib/types/dialog'

export const dialogInitialState: DialogState = {
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
