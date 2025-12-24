import { useContext } from 'react'
import type { ReactNode } from 'react'
import { DialogContext } from '~/lib/context/dialog'

export const useDialog = () => {
  const { dispatch } = useContext(DialogContext)

  const openDialog = (dialog: ReactNode) => {
    dispatch({
      type: 'OPEN',
      data: {
        isOpen: true,
        dialog
      }
    })
  }

  const closeDialog = () => {
    dispatch({
      type: 'CLOSE',
      data: {
        isOpen: false,
        dialog: null
      }
    })
  }

  return [openDialog, closeDialog] as const
}
