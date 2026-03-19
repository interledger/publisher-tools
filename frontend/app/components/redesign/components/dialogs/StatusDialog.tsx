import React from 'react'
import { SVGMarkSuccess, SVGErrorVector } from '@/assets'
import { ToolsSecondaryButton } from '@/components'
import { BaseDialog } from './BaseDialog'

interface Props {
  onDone?: () => void
  message?: string
  fieldErrors?: Record<string, string>
  status?: 'error' | 'success'
}

export const StatusDialog: React.FC<Props> = ({
  onDone,
  message = 'Your edits have been saved',
  fieldErrors,
  status,
}) => {
  return (
    <BaseDialog className="p-4 pt-8 flex flex-col items-center gap-md max-w-[34rem] w-[calc(100%-2rem)]">
      <div className="flex items-center gap-2">
        {status === 'error' || fieldErrors ? (
          <SVGErrorVector className="size-6" />
        ) : (
          <SVGMarkSuccess className="size-6" />
        )}
        <p className="text-base leading-md font-bold text-text-primary">
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
    </BaseDialog>
  )
}
