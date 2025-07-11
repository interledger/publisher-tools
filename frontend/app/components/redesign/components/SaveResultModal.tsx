import React from 'react'
import { cx } from 'class-variance-authority'
import { ToolsSecondaryButton } from './ToolsSecondaryButton'
import { SVGMarkSuccess, SVGClose, SVGErrorVector } from '~/assets/svg'

interface SaveResultModalProps {
  isOpen?: boolean
  onClose?: () => void
  onDone?: () => void
  message?: string
  isSuccess?: boolean
  className?: string
}

export const SaveResultModal: React.FC<SaveResultModalProps> = ({
  isOpen = true,
  onClose,
  onDone,
  message = 'Your edits have been saved',
  isSuccess = true,
  className = ''
}) => {
  if (!isOpen) {
    return null
  }

  return (
    <div
      className={cx(
        'bg-interface-bg-container',
        'border border-interface-edge-container',
        'rounded-lg',
        'p-8 pt-8 pb-4',
        'flex flex-col items-center gap-6',
        'w-full max-w-[426px]',
        'relative',
        className
      )}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-6 h-6 text-text-primary hover:text-text-secondary transition-colors"
          aria-label="Close modal"
        >
          <SVGClose className="w-6 h-6" />
        </button>
      )}
      <div className="flex items-center justify-center">
        {isSuccess ? (
          <SVGMarkSuccess className="w-[60px] h-[60px]" />
        ) : (
          <SVGErrorVector />
        )}
      </div>
      <div className="text-center">
        <p className="text-base leading-md font-normal text-text-primary">
          {message}
        </p>
      </div>
      <div className="w-full">
        <ToolsSecondaryButton
          className="w-full flex items-center justify-center"
          onClick={onDone}
        >
          Done
        </ToolsSecondaryButton>
      </div>
    </div>
  )
}
export default SaveResultModal
