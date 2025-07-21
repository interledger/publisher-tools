import React, { useEffect, useRef } from 'react'
import { cx } from 'class-variance-authority'
import { ToolsPrimaryButton } from '@/components'
import { SVGClose } from '~/assets/svg'
import { BodyStandard } from '../../Typography'

interface ImportTagModalProps {
  isOpen?: boolean
  onClose?: () => void
  onConfirm?: () => void
  tag: string
  errorMessage: string
  setTag: (tag: string) => void
  className?: string
}

export const ImportTagModal: React.FC<ImportTagModalProps> = ({
  isOpen,
  onClose,
  tag,
  setTag,
  onConfirm,
  className = '',
  errorMessage
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<Element | null>(null)

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement
      modalRef.current?.focus()

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && onClose) {
          onClose()
        }
      }

      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen, onClose])

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && onClose) {
      onClose()
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-silver-400 bg-opacity-40 px-md md:px-0"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={cx(
          'relative w-full max-w-[426px] bg-interface-bg-container',
          'border-[1.135px] border-interface-edge-container',
          'pt-2xl pb-md rounded-lg',
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-silver-800 hover:text-text-secondary transition-colors"
          aria-label="Close modal"
        >
          <SVGClose className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center justify-center gap-lg px-md">
          <BodyStandard>Import existing revshare configuration</BodyStandard>
          <textarea
            id="linkTagInput"
            className={cx(
              'py-sm pl-md pr-xs rounded-lg border border-silver-300 resize-none',
              'w-full max-w-full h-[136px]',
              'focus:border-field-border-focus focus:outline-none focus:ring-1 focus:ring-primary-focus'
            )}
            placeholder="Your link tag here"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          />
          {errorMessage && (
            <p className="text-sm text-red-500 w-full">{errorMessage}</p>
          )}
          <ToolsPrimaryButton className="w-full" onClick={onConfirm}>
            Import revshare(s)
          </ToolsPrimaryButton>
        </div>
      </div>
    </div>
  )
}
