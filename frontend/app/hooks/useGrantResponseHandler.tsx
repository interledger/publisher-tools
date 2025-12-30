import { useEffect } from 'react'
import { SaveResultModal, useSaveResultModal } from '@/components'
import { useDialog } from '~/hooks/useDialog'
import { toolState, toolActions } from '~/stores/toolStore'

export const useGrantResponseHandler = (
  grantResponse: string,
  isGrantAccepted: boolean,
  isGrantResponse: boolean
) => {
  const [openDialog, closeDialog] = useDialog()
  const showSaveResult = useSaveResultModal()

  useEffect(() => {
    if (!isGrantResponse) return

    const handleGrantResponse = async () => {
      toolActions.setGrantResponse(grantResponse, isGrantAccepted)

      if (!toolState.isGrantAccepted) {
        openDialog(
          <SaveResultModal
            onDone={closeDialog}
            message="Grant was not accepted"
            status="error"
          />
        )
        return
      }

      try {
        await toolActions.saveConfig(toolState.lastSaveAction)
        showSaveResult(toolState.lastSaveAction)
      } catch (err) {
        const error = err as Error
        // @ts-expect-error TODO: type error.cause properly
        const fieldErrors = error.cause?.details?.errors?.fieldErrors
        showSaveResult(toolState.lastSaveAction, {
          message: error.message,
          fieldErrors
        })
      }
    }

    handleGrantResponse()
  }, [grantResponse, isGrantAccepted, isGrantResponse, showSaveResult])
}
