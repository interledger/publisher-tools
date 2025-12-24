import React from 'react'
import { cx } from 'class-variance-authority'
import { SVGMarkSuccess, SVGErrorVector } from '@/assets'
import { ToolsSecondaryButton } from '@/components'
import { BaseModal } from './modals/BaseModal'

interface SaveResultModalProps {
  onDone?: () => void
  message?: string
  fieldErrors?: Record<string, string>
  status?: 'error' | 'success'
  className?: string
}

export const StatusModal: React.FC<SaveResultModalProps> = ({
  onDone,
  message = 'Your edits have been saved',
  fieldErrors,
  status,
  className = ''
}) => (
  <BaseModal>
    <div
      className={cx(
        'bg-interface-bg-container',
        'border border-interface-edge-container',
        'rounded-lg',
        'p-8 pt-8 pb-4',
        'flex flex-col items-center gap-6',
        'w-[426px]',
        'relative',
        className
      )}
    >
      <div className="flex items-center justify-center">
        {status === 'error' || fieldErrors ? (
          <SVGErrorVector className="w-[60px] h-[60px]" />
        ) : (
          <SVGMarkSuccess className="w-[60px] h-[60px]" />
        )}
      </div>
      <div className="text-center">
        <p className="text-base leading-md font-normal text-text-primary">
          {message}
        </p>
      </div>
      {fieldErrors && Object.keys(fieldErrors).length && (
        <details className="self-start text-left">
          <ul className="list-disc ml-6 text-sm text-field-helpertext-default">
            {Object.entries(fieldErrors).map(([key, msg], i) => (
              <li key={i}>
                <span className="font-medium">{key}</span>: {msg as string}
              </li>
            ))}
          </ul>
        </details>
      )}
      <div className="w-full">
        <ToolsSecondaryButton
          className="w-full flex items-center justify-center"
          onClick={onDone}
        >
          Done
        </ToolsSecondaryButton>
      </div>
    </div>
  </BaseModal>
)

export default StatusModal
