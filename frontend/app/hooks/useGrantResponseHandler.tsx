import { useEffect } from 'react'
import { StatusDialog } from '@/components'
import { useDialog } from '~/hooks/useDialog'
import { useTranslation } from '~/i18n/useTranslation'
import type { GrantOutcome } from '~/lib/types'

interface UseGrantResponseHandlerOptions {
  onGrantSuccess: () => void | Promise<unknown>
}

export const useGrantResponseHandler = (
  grantResponse: GrantOutcome | undefined,
  isGrantAccepted: boolean | undefined,
  isGrantResponse: boolean | undefined,
  options: UseGrantResponseHandlerOptions,
) => {
  const [openDialog, closeDialog] = useDialog()
  const t = useTranslation('grantInteraction')

  useEffect(() => {
    if (!isGrantResponse) return

    const handleGrantResponse = async () => {
      if (!isGrantAccepted) {
        openDialog(
          <StatusDialog
            onDone={closeDialog}
            message={grantResponse ? t(grantResponse) : undefined}
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
