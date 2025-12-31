import { useCallback } from 'react'
import { WalletOwnershipModal, useSaveResultModal } from '@/components'
import { useDialog } from '~/hooks/useDialog'
import { toolActions, toolState } from '~/stores/toolStore'

interface SaveResult {
  success: boolean
  grantRequired?: boolean
}

export const useSaveConfig = () => {
  const [openDialog] = useDialog()
  const showSaveResult = useSaveResultModal()

  const save = useCallback(
    async (action: 'save-success' | 'script'): Promise<SaveResult> => {
      toolState.lastSaveAction = action

      try {
        const response = await toolActions.saveConfig()

        if (!response.success && response.data?.grantRequired) {
          openDialog(
            <WalletOwnershipModal grantRedirect={response.data.grantRequired} />
          )
          return { success: false, grantRequired: true }
        }

        showSaveResult(action)
        return { success: true }
      } catch (err) {
        const error = err as Error
        console.error({ error })
        // @ts-expect-error TODO: type error.cause properly
        const fieldErrors = error.cause?.details?.errors?.fieldErrors
        showSaveResult(action, {
          message: error.message,
          fieldErrors
        })
        return { success: false }
      }
    },
    []
  )

  const saveLastAction = useCallback(async (): Promise<SaveResult> => {
    return save(toolState.lastSaveAction)
  }, [])

  return { save, saveLastAction }
}
