import { useEffect } from 'react'
import { StatusDialog } from '@/components'
import { useDialog } from '~/hooks/useDialog'

interface UseGrantResponseHandlerOptions {
  onGrantSuccess: () => void | Promise<unknown>
}

export const useGrantResponseHandler = (
  grantResponse: string,
  isGrantAccepted: boolean,
  isGrantResponse: boolean,
  options: UseGrantResponseHandlerOptions,
) => {
  const [openDialog, closeDialog] = useDialog()

  useEffect(() => {
    if (!isGrantResponse) return

    const handleGrantResponse = async () => {
      if (!isGrantAccepted) {
        openDialog(
          <StatusDialog
            onDone={closeDialog}
            message={grantResponse}
            status="error"
          />,
        )
        return
      }

      await options.onGrantSuccess()
    }

    handleGrantResponse()
  }, [])
}
