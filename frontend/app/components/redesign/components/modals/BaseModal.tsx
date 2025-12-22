import React, { useEffect, useRef } from 'react'
import { SVGClose } from '@/assets'
import { modalActions } from '~/stores/modal-store'

interface ModalContainerProps {
  children: React.ReactNode
}

export const BaseModal: React.FC<ModalContainerProps> = ({ children }) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const handleClose = () => modalActions.close()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
    }
    const handleCancel = (e: Event) => {
      // close dialog on ESC key
      e.preventDefault()
      handleClose()
    }
    dialog?.addEventListener('cancel', handleCancel)
    return () => {
      dialog?.removeEventListener('cancel', handleCancel)
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="bg-transparent backdrop:bg-[#8995a7]/65 shadow-2xl"
    >
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 w-6 h-6 hover:bg-secondary-hover-surface transition-colors z-30"
        aria-label="Close dialog"
      >
        <SVGClose className="w-6 h-6" />
      </button>
      {children}
    </dialog>
  )
}
