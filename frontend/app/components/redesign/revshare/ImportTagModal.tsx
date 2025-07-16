import React from 'react'
import { cx } from 'class-variance-authority'
import { ToolsSecondaryButton } from '@/components'
import { SVGClose } from '~/assets/svg'

interface ImportTagModalProps {
  isOpen?: boolean
  onClose?: () => void
  onConfirm?: () => void
  className?: string
}

export const ImportTagModal: React.FC<ImportTagModalProps> = ({
  isOpen = true,
  onClose,
  onConfirm,
  className = ''
}) => {
  if (!isOpen) {
    return null
  }
  return (
    <div
      className={cx(
        'bg-interface-bg-container',
        'border-[1.135px] border-interface-edge-container',
        'rounded-lg',
        'pt-2xl pb-md',
        'flex flex-col items-center justify-center gap-lg',
        'w-full max-w-[426px]',
        'relative',
        className
      )}
    >
      Import Tag Modal
    </div>
  )
}
