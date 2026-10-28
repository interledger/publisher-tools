import { useEffect, useEffectEvent } from 'react'
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

  const handleGrantResponse = useEffectEvent(async () => {
    if (!isGrantResponse) return

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
  })

  // Handle the grant response once, when the page loads after the redirect.
  useEffect(() => {
    handleGrantResponse()
  }, [])
}
