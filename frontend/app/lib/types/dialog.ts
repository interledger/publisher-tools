import type { ReactNode } from 'react'

export type DialogState = {
  isOpen: boolean
  dialog: ReactNode | null
}

export type DialogAction =
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
