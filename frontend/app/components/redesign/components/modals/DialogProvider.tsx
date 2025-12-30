import {
  createContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode
} from 'react'
import { useDialog } from '~/hooks/useDialog'
import SaveResultModal from '../SaveResultModal'
import ScriptReadyModal from '../ScriptReadyModal'

export const DialogContext = createContext<{
  openDialog: (dialog: ReactNode) => void
  closeDialog: () => void
}>({
  openDialog: () => null,
  closeDialog: () => null
})

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const [dialog, setDialog] = useState<ReactNode | null>(null)

  const openDialog = useCallback((content: ReactNode) => setDialog(content), [])
  const closeDialog = useCallback(() => setDialog(null), [])

  const value = useMemo(
    () => ({ openDialog, closeDialog }),
    [openDialog, closeDialog]
  )

  return (
    <DialogContext.Provider value={value}>
      {dialog}
      {children}
    </DialogContext.Provider>
  )
}

export const useSaveResultModal = () => {
  const [openDialog, closeDialog] = useDialog()

  const showSaveResult = useCallback(
    (
      action: 'save-success' | 'script',
      error?: { message?: string; fieldErrors?: Record<string, string> }
    ) => {
      if (error) {
        openDialog(
          <SaveResultModal
            onDone={closeDialog}
            message={error.message || 'An error occurred'}
            fieldErrors={error.fieldErrors}
            status="error"
          />
        )
      } else if (action === 'script') {
        openDialog(<ScriptReadyModal />)
      } else {
        openDialog(<SaveResultModal onDone={closeDialog} />)
      }
    },
    [openDialog, closeDialog]
  )

  return showSaveResult
}
