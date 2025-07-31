import React, { useEffect, useRef } from 'react'
import { cx } from 'class-variance-authority'
import { ToolsPrimaryButton } from '@/components'
import { SVGClose } from '@/assets'

interface ImportTagModalProps {
  isOpen?: boolean
  onClose?: () => void
  onConfirm?: () => void
  tag: string
  errorMessage: string
  setTag: (tag: string) => void
  setImportError: (error: string) => void
  className?: string
}

const PLACEHOLDER_LINK_TAG = `<link rel="monetization" href="https://webmonetization.org/api/revshare/pay/your-revshare-id">`

export const ImportTagModal: React.FC<ImportTagModalProps> = ({
  isOpen,
  onClose,
  tag,
  setTag,
  onConfirm,
  className = '',
  errorMessage,
  setImportError
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<Element | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const focusableElementsRef = useRef<NodeListOf<HTMLElement> | null>(null)

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement

      focusableElementsRef.current = modalRef.current?.querySelectorAll(
        'button:not([disabled]), textarea:not([disabled])'
      ) as NodeListOf<HTMLElement> | null

      inputRef.current?.focus()

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && onClose) {
          onClose()
        }

        if (event.key === 'Tab') {
          const focusableElements = focusableElementsRef.current

          if (!focusableElements || focusableElements.length === 0) {
            event.preventDefault()
            return
          }

          const firstFocusableElement = focusableElements[0]
          const lastFocusableElement =
            focusableElements[focusableElements.length - 1]

          const currentActiveElement = document.activeElement as HTMLElement
          if (event.shiftKey) {
            if (currentActiveElement === firstFocusableElement) {
              lastFocusableElement.focus()
              event.preventDefault()
            }
          } else {
            if (currentActiveElement === lastFocusableElement) {
              firstFocusableElement.focus()
              event.preventDefault()
            }
          }
        }
      }

      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)

        if (triggerRef.current) {
          ;(triggerRef.current as HTMLElement).focus()
        }
        focusableElementsRef.current = null
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-modal-title"
      >
        <button
          onClick={onClose}
          className={cx(
            'absolute top-3 right-3 text-silver-800 hover:text-text-secondary transition-colors rounded-sm',
            'focus:border-field-border-focus focus:outline-none focus:ring-2 focus:ring-primary-focus'
          )}
          aria-label="Close modal"
        >
          <SVGClose className="w-6 h-6" aria-hidden="true" />
        </button>
        <div
          className={cx(
            'flex flex-col items-center justify-center px-md',
            errorMessage ? '' : 'gap-lg'
          )}
        >
          <h2 id="import-modal-title" className="text-style-body-standard">
            Import existing revshare configuration
          </h2>
          <label htmlFor="linkTagInput" className="sr-only">
            Paste monetization link tag
          </label>
          <textarea
            id="linkTagInput"
            ref={inputRef}
            className={cx(
              'py-sm pl-md pr-xs rounded-lg border border-silver-300 resize-none',
              'w-full max-w-full h-[136px]',
              'focus:border-field-border-focus focus:outline-none focus:ring-1 focus:ring-primary-focus',
              'placeholder:text-xs sm:placeholder:text-sm'
            )}
            placeholder={PLACEHOLDER_LINK_TAG}
            value={tag}
            onChange={(e) => {
              setTag(e.target.value)
              setImportError('')
            }}
            aria-label="Paste monetization link tag"
            aria-invalid={!!errorMessage}
            aria-describedby={errorMessage ? 'import-error-message' : undefined}
          />
          {errorMessage && (
            <p
              id="import-error-message"
              className="text-xs text-text-error w-full my-2"
              role="alert"
              aria-live="polite"
            >
              {errorMessage}
            </p>
          )}
          <ToolsPrimaryButton className="w-full" onClick={onConfirm}>
            Import revshare
          </ToolsPrimaryButton>
        </div>
      </div>
    </div>
  )
}
