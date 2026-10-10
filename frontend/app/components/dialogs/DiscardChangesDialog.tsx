import React from 'react'
import { ToolsPrimaryButton, ToolsSecondaryButton } from '@/components'
import { BodyEmphasis, BodyStandard } from '@/typography'
import { BaseDialog } from './BaseDialog'

interface Props {
  onDiscard: () => void
  onCancel: () => void
}

export const DiscardChangesDialog: React.FC<Props> = ({
  onDiscard,
  onCancel,
}) => {
  return (
    <BaseDialog className="p-md pt-xl flex flex-col items-center gap-md">
      <div className="text-center">
        <BodyEmphasis className="text-lg">Discard changes?</BodyEmphasis>
      </div>
      <div className="text-center">
        <BodyStandard className="text-field-helpertext-default!">
          Are you sure you want to discard your current changes? All unsaved
          edits in this section will be lost.
        </BodyStandard>
      </div>
      <div className="flex flex-col-reverse sm:flex-row gap-sm w-full mt-sm">
        <ToolsSecondaryButton
          className="flex-1 flex items-center justify-center"
          onClick={onCancel}
        >
          Continue
        </ToolsSecondaryButton>
        <ToolsPrimaryButton
          className="flex-1 flex items-center justify-center !bg-red-600 hover:!bg-red-700"
          onClick={onDiscard}
        >
          Discard changes
        </ToolsPrimaryButton>
      </div>
    </BaseDialog>
  )
}
