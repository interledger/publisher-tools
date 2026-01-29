import { useCallback } from 'react'
import { ProfilesDialog, StatusDialog } from '@/components'
import { type Tool, type ToolProfiles, TOOL_BANNER } from '@shared/types'
import { useDialog } from '~/hooks/useDialog'
import { ApiError } from '~/lib/helpers'
import { actions, banner } from '~/stores/banner-store'
import { toolActions, toolState } from '~/stores/toolStore'
import {
  convertToConfigsLegacy,
  convertToProfiles,
} from '~/utils/profile-converter'

async function getProfiles(): Promise<ToolProfiles<Tool>> {
  if (toolState.currentToolType === 'banner') {
    const profiles = await actions.getProfiles(TOOL_BANNER)
    return profiles
  }

  return await actions.getProfiles(toolState.currentToolType as Tool)
}

function setProfiles(profiles: ToolProfiles<Tool>) {
  if (toolState.currentToolType === 'banner') {
    actions.setProfiles(profiles as ToolProfiles<'banner'>)
    actions.commitProfiles()
  } else {
    const config = convertToConfigsLegacy(toolState.walletAddressId, profiles)
    toolActions.setConfigs(config)
  }
}

function getLegacyOptions() {
  if (toolState.currentToolType === 'banner') {
    return {
      hasConflicts: banner.profilesUpdate.size > 0,
      updates: [...banner.profilesUpdate],
      profiles: banner.profiles,
    }
  }
  return {
    hasConflicts: toolState.dirtyProfiles.size > 0,
    updates: [...toolState.dirtyProfiles],
    profiles: convertToProfiles(
      toolState.configurations,
      toolState.currentToolType as Tool,
    ),
  }
}

export const useConnectWallet = () => {
  const [openDialog, closeDialog] = useDialog()

  const connect = useCallback(async (): Promise<void> => {
    try {
      const fetchedProfiles = await getProfiles()
      const options = getLegacyOptions()
      if (options.hasConflicts) {
        openDialog(
          <ProfilesDialog
            fetchedConfigs={fetchedProfiles}
            currentLocalConfigs={options.profiles}
            modifiedVersions={options.updates}
          />,
        )
        return
      }

      setProfiles(fetchedProfiles)
      toolActions.setHasRemoteConfigs(true)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        toolActions.setHasRemoteConfigs(false)
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
  }, [openDialog])

  return { connect }
}
