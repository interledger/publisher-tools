import {
  createContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'

export const DialogContext = createContext<{
  openDialog: (dialog: ReactNode) => void
  closeDialog: () => void
}>({
  openDialog: () => null,
  closeDialog: () => null,
})

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const [dialog, setDialog] = useState<ReactNode | null>(null)

  const openDialog = useCallback((content: ReactNode) => setDialog(content), [])
  const closeDialog = useCallback(() => setDialog(null), [])

  const value = useMemo(
    () => ({ openDialog, closeDialog }),
    [openDialog, closeDialog],
  )

  return (
    <DialogContext.Provider value={value}>
      {dialog}
      {children}
    </DialogContext.Provider>
  )
}
