import { useCallback } from 'react'
import {
  StatusDialog,
  ScriptDialog,
  GrantConfirmationDialog
} from '@/components'
import { useDialog } from '~/hooks/useDialog'
import { actions } from '~/stores/banner-store'
import { toolState } from '~/stores/toolStore'

export const useSaveProfile = () => {
  const [openDialog, closeDialog] = useDialog()

  const save = useCallback(
    async (action: 'save-success' | 'script'): Promise<void> => {
      toolState.lastSaveAction = action

      try {
        const response = await actions.saveProfile()

        if (!response.success && response.grantRequired) {
          openDialog(
            <GrantConfirmationDialog grantRedirect={response.grantRequired} />
          )
          return
        }

        if (action === 'script') {
          openDialog(<ScriptDialog />)
        } else {
          openDialog(<StatusDialog onDone={closeDialog} />)
        }
      } catch (err) {
        const error = err as Error
        console.error({ error })
        // TODO: type error.cause properly
        const fieldErrors = { errors: error?.cause } as Record<string, string>
        openDialog(
          <StatusDialog
            onDone={closeDialog}
            message={error.message || 'An error occurred'}
            fieldErrors={fieldErrors}
            status="error"
          />
        )
      }
    },
    [openDialog, closeDialog]
  )

  const saveLastAction = useCallback(async (): Promise<void> => {
    return save(toolState.lastSaveAction)
  }, [save])

  return { save, saveLastAction }
}
