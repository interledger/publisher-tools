import { useCallback } from 'react'
import {
  StatusDialog,
  ScriptDialog,
  GrantConfirmationDialog
} from '@/components'
import { useDialog } from '~/hooks/useDialog'
import { ApiError } from '~/lib/helpers'
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
        const errorMessage =
          err instanceof ApiError || err instanceof Error
            ? err.message
            : 'Use save profile error'

        openDialog(
          <StatusDialog
            onDone={closeDialog}
            message={errorMessage}
            fieldErrors={err instanceof ApiError ? err.cause : undefined}
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
