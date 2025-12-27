import React from 'react'
import { SVGMarkSuccess, SVGErrorVector } from '~/assets/svg'
import { BaseModal } from './modals/BaseModal'
import { ToolsSecondaryButton } from './ToolsSecondaryButton'

interface SaveResultModalProps {
  isOpen?: boolean
  onClose?: () => void
  onDone?: () => void
  message?: string
  fieldErrors?: Record<string, string>
  isSuccess?: boolean
}

export const SaveResultModal: React.FC<SaveResultModalProps> = ({
  isOpen = true,
  onDone,
  message = 'Your edits have been saved',
  fieldErrors,
  isSuccess = true
}) => {
  if (!isOpen) {
    return null
  }

  return (
    <BaseModal
      className="p-8 pb-4
        flex flex-col items-center gap-6 w-[426px]"
    >
      <div className="flex items-center justify-center">
        {isSuccess ? (
          <SVGMarkSuccess className="w-[60px] h-[60px]" />
        ) : (
          <SVGErrorVector className="w-[60px] h-[60px]" />
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
    </BaseModal>
  )
}
export default SaveResultModal
