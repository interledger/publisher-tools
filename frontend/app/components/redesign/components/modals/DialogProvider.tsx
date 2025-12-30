import { createContext, useState, type ReactNode } from 'react'

export const DialogContext = createContext<{
  openDialog: (dialog: ReactNode) => void
  closeDialog: () => void
}>({
  openDialog: () => null,
  closeDialog: () => null
})

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const [dialog, setDialog] = useState<ReactNode | null>(null)

  const openDialog = (content: ReactNode) => setDialog(content)
  const closeDialog = () => setDialog(null)

  const Dialog = () => {
    if (!dialog) return null
    return dialog
  }

  return (
    <DialogContext.Provider value={{ openDialog, closeDialog }}>
      <Dialog />
      {children}
    </DialogContext.Provider>
  )
}
