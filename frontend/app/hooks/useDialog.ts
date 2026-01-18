import { useContext } from 'react'
import { DialogContext } from '@/components'

export const useDialog = () => {
  const { openDialog, closeDialog } = useContext(DialogContext)
  return [openDialog, closeDialog] as const
}
