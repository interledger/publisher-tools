import { useCallback } from 'react'
import {
  StatusDialog,
  ScriptDialog,
  GrantConfirmationDialog
} from '@/components'
import { useDialog } from '~/hooks/useDialog'
import { toolActions, toolState } from '~/stores/toolStore'

interface SaveResult {
  success: boolean
  grantRequired?: boolean
}

export const useSaveConfig = () => {
  const [openDialog, closeDialog] = useDialog()

  const save = useCallback(
    async (action: 'save-success' | 'script'): Promise<SaveResult> => {
      toolState.lastSaveAction = action

      try {
        const response = await toolActions.saveConfig()

        if (!response.success && response.data?.grantRequired) {
          openDialog(
            <GrantConfirmationDialog
              grantRedirect={response.data.grantRequired}
            />
          )
          return { success: false, grantRequired: true }
        }

        if (action === 'script') {
          openDialog(<ScriptDialog />)
        } else {
          openDialog(<StatusDialog onDone={closeDialog} />)
        }
        return { success: true }
      } catch (err) {
        const error = err as Error
        console.error({ error })
        // @ts-expect-error TODO: type error.cause properly
        const fieldErrors = error.cause?.details?.errors?.fieldErrors
        openDialog(
          <StatusDialog
            onDone={closeDialog}
            message={error.message || 'An error occurred'}
            fieldErrors={fieldErrors}
            status="error"
          />
        )
        return { success: false }
      }
    },
    [openDialog, closeDialog]
  )

  const saveLastAction = useCallback(async (): Promise<SaveResult> => {
    return save(toolState.lastSaveAction)
  }, [save])

  return { save, saveLastAction }
}
