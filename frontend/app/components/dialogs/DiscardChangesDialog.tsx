import React from 'react'
import { ToolsPrimaryButton, ToolsSecondaryButton } from '@/components'
import { BodyEmphasis, BodyStandard } from '@/typography'
import { BaseDialog } from './BaseDialog'

interface Props {
  onDiscard: () => void
  onCancel: () => void
  title?: string
  description?: string
  discardLabel?: string
}

export const DiscardChangesDialog: React.FC<Props> = ({
  onDiscard,
  onCancel,
  title = 'Discard changes?',
  description = 'Are you sure you want to discard your current changes? All unsaved edits in this section will be lost.',
  discardLabel = 'Discard changes',
}) => {
  return (
    <BaseDialog
      className="p-md pt-xl flex flex-col items-center gap-md"
      aria-labelledby="discard-changes-title"
    >
      <div className="text-center">
        <BodyEmphasis id="discard-changes-title" as="h2" className="text-lg">
          {title}
        </BodyEmphasis>
      </div>
      <div className="text-center">
        <BodyStandard className="text-field-helpertext-default!">
          {description}
        </BodyStandard>
      </div>
      <div className="flex flex-col-reverse sm:flex-row gap-sm w-full mt-sm">
        <ToolsSecondaryButton
          className="flex-1 flex items-center justify-center"
          onClick={onCancel}
        >
          Keep changes
        </ToolsSecondaryButton>
        <ToolsPrimaryButton
          className="flex-1 flex items-center justify-center bg-red-600! hover:bg-red-700!"
          onClick={onDiscard}
        >
          {discardLabel}
        </ToolsPrimaryButton>
      </div>
    </BaseDialog>
  )
}
