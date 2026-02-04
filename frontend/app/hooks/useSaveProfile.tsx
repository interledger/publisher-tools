import { useCallback } from 'react'
import {
  StatusDialog,
  ScriptDialog,
  GrantConfirmationDialog,
} from '@/components'
import { TOOL_BANNER, TOOL_WIDGET } from '@shared/types'
import { useDialog } from '~/hooks/useDialog'
import { ApiError } from '~/lib/helpers'
import { actions as bannerActions } from '~/stores/banner-store'
import { toolState } from '~/stores/toolStore'
import { actions as widgetActions } from '~/stores/widget-store'

function getToolActions() {
  switch (toolState.currentToolType) {
    case TOOL_BANNER:
      return bannerActions
    case TOOL_WIDGET:
      return widgetActions
    default:
      throw new Error(`Unsupported tool type: ${toolState.currentToolType}`)
  }
}

export const useSaveProfile = () => {
  const [openDialog, closeDialog] = useDialog()

  const save = useCallback(
    async (action: 'save-success' | 'script'): Promise<void> => {
      toolState.lastSaveAction = action
      const actions = getToolActions()
      try {
        const result = await actions.saveProfile()

        if (result.grantRedirect) {
          openDialog(
            <GrantConfirmationDialog grantRedirect={result.grantRedirect} />,
          )
          return
        }

        if (result.success) {
          actions.commitProfile()

          if (action === 'script') {
            openDialog(<ScriptDialog />)
          } else {
            openDialog(<StatusDialog onDone={closeDialog} />)
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof ApiError ? err.message : 'Use save profile error'

        openDialog(
          <StatusDialog
            onDone={closeDialog}
            message={errorMessage}
            fieldErrors={err instanceof ApiError ? err.cause : undefined}
            status="error"
          />,
        )
      }
    },
    [openDialog, closeDialog],
  )

  const saveLastAction = useCallback(async (): Promise<void> => {
    return save(toolState.lastSaveAction)
  }, [save])

  return { save, saveLastAction }
}
