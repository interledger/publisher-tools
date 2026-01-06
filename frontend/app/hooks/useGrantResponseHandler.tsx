import { useEffect } from 'react'
import { StatusDialog } from '@/components'
import { useDialog } from '~/hooks/useDialog'
import { toolActions } from '~/stores/toolStore'

interface UseGrantResponseHandlerOptions {
  onGrantSuccess: () => void | Promise<unknown>
}

export const useGrantResponseHandler = (
  grantResponse: string,
  isGrantAccepted: boolean,
  isGrantResponse: boolean,
  options: UseGrantResponseHandlerOptions
) => {
  const [openDialog, closeDialog] = useDialog()

  useEffect(() => {
    if (!isGrantResponse) return

    const handleGrantResponse = async () => {
      toolActions.setGrantResponse(grantResponse, isGrantAccepted)

      if (!isGrantAccepted) {
        const errorMessage = 'Grant was not accepted'
        openDialog(
          <StatusDialog
            onDone={closeDialog}
            message={errorMessage}
            status="error"
          />
        )
        return
      }

      await options.onGrantSuccess()
    }

    handleGrantResponse()
  }, [])
}
