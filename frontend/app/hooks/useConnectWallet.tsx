import { useCallback } from 'react'
import { ProfilesDialog, StatusDialog } from '@/components'
import { PROFILE_A } from '@shared/types'
import { useDialog } from '~/hooks/useDialog'
import { ApiError } from '~/lib/helpers'
import { banner } from '~/stores/banner-store'
import { offerwall } from '~/stores/offerwall-store'
import { toolActions, toolState } from '~/stores/toolStore'
import { useUIActions } from '~/stores/uiStore'
import type { WalletActions, WalletStore } from '~/stores/wallet-store'
import { widget } from '~/stores/widget-store'

function getLegacyOptions() {
  //TODO: refactor ProfilesDialog and remove legacy options
  if (toolState.currentToolType === 'banner') {
    return {
      hasConflicts: banner.profilesUpdate.size > 0,
      updates: [...banner.profilesUpdate],
      profiles: banner.profiles,
    }
  }

  if (toolState.currentToolType === 'offerwall') {
    return {
      hasConflicts: offerwall.profilesUpdate.size > 0,
      updates: [...offerwall.profilesUpdate],
      profiles: offerwall.profiles,
    }
  }

  return {
    hasConflicts: widget.profilesUpdate.size > 0,
    updates: [...widget.profilesUpdate],
    profiles: widget.profiles,
  }
}

export const useConnectWallet = (
  wallet: WalletStore,
  walletActions: WalletActions,
) => {
  const [openDialog, closeDialog] = useDialog()
  const uiActions = useUIActions()

  const resetWalletUIState = useCallback(() => {
    toolActions.setActiveTab(PROFILE_A)
    toolActions.setBuildCompleteStep('unfilled')
    uiActions.setContentComplete(false)
    uiActions.setAppearanceComplete(false)
    uiActions.setActiveSection('content')
  }, [uiActions])

  const connect = useCallback(async (): Promise<void> => {
    try {
      const fetchedProfiles = await toolActions.getToolProfiles()
      const options = getLegacyOptions()
      if (options.hasConflicts) {
        openDialog(
          <ProfilesDialog
            walletActions={walletActions}
            fetchedConfigs={fetchedProfiles}
            currentLocalConfigs={options.profiles}
            modifiedVersions={options.updates}
          />,
        )
        return
      }

      toolActions.setToolProfiles(fetchedProfiles)
      walletActions.setHasRemoteConfigs(true)
      walletActions.setWalletConnected(true)
      resetWalletUIState()
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        walletActions.setHasRemoteConfigs(false)
        walletActions.setWalletConnected(true)
        return
      }

      const errorMessage =
        err instanceof ApiError ? err.message : 'Use connect wallet error'

      openDialog(
        <StatusDialog
          onDone={closeDialog}
          message={errorMessage}
          fieldErrors={
            err instanceof ApiError ? err.cause : { error: String(err) }
          }
          status="error"
        />,
      )
      throw err
    }
  }, [openDialog, resetWalletUIState, walletActions])

  const disconnect = useCallback(() => {
    toolActions.resetToolProfiles()
    walletActions.setWalletConnected(false)
    walletActions.setHasRemoteConfigs(false)
    walletActions.clearWalletStorage()
    resetWalletUIState()
    uiActions.focusWalletInput()
  }, [uiActions, resetWalletUIState, walletActions])

  return { connect, disconnect }
}
