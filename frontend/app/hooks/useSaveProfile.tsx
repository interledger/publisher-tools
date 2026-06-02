import { useCallback } from 'react'
import {
  StatusDialog,
  ScriptDialog,
  GrantConfirmationDialog,
} from '@/components'
import {
  TOOL_BANNER,
  TOOL_OFFERWALL,
  TOOL_PAYWALL,
  TOOL_WIDGET,
} from '@shared/types'
import { useDialog } from '~/hooks/useDialog'
import { useTrackEvent } from '~/lib/analytics'
import { ApiError } from '~/lib/helpers'
import { actions as bannerActions } from '~/stores/banner-store'
import { actions as offerwallActions } from '~/stores/offerwall-store'
import { actions as paywallActions } from '~/stores/paywall-store'
import { toolState } from '~/stores/toolStore'
import type { WalletStore } from '~/stores/wallet-store'
import { actions as widgetActions } from '~/stores/widget-store'

function getToolActions() {
  switch (toolState.currentToolType) {
    case TOOL_BANNER:
      return bannerActions
    case TOOL_WIDGET:
      return widgetActions
    case TOOL_OFFERWALL:
      return offerwallActions
    case TOOL_PAYWALL:
      return paywallActions
    default:
      throw new Error(`Unsupported tool type: ${toolState.currentToolType}`)
  }
}

export const useSaveProfile = (wallet: WalletStore) => {
  const [openDialog, closeDialog] = useDialog()
  const trackEvent = useTrackEvent()

  const save = useCallback(
    async (action: 'save-success' | 'script'): Promise<void> => {
      toolState.lastSaveAction = action
      const actions = getToolActions()
      try {
        const result = await actions.saveProfile()

        if (result.grantRedirect) {
          openDialog(
            <GrantConfirmationDialog
              walletAddress={wallet.walletAddress}
              grantRedirect={result.grantRedirect}
            />,
          )
          return
        }

        if (result.success) {
          actions.commitProfile()
          const tool = toolState.currentToolType

          if (action === 'script') {
            trackEvent(`${tool}_script_generated`)
            openDialog(<ScriptDialog wallet={wallet} />)
          } else {
            trackEvent(`${tool}_profile_saved`)
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
    [openDialog, closeDialog, trackEvent],
  )

  const saveLastAction = useCallback(async (): Promise<void> => {
    return save(toolState.lastSaveAction)
  }, [save])

  return { save, saveLastAction }
}
