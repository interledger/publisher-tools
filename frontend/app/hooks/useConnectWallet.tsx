import { useCallback } from 'react'
import { useSnapshot } from 'valtio'
import { ProfilesDialog, StatusDialog } from '@/components'
import {
  type Tool,
  type ToolProfiles,
  type ProfileId,
  TOOL_BANNER,
} from '@shared/types'
import { useDialog } from '~/hooks/useDialog'
import { ApiError } from '~/lib/helpers'
import { actions, banner } from '~/stores/banner-store'
import { toolActions, toolState } from '~/stores/toolStore'
import {
  convertToConfigsLegacy,
  convertToProfiles,
} from '~/utils/profile-converter'

async function getProfiles(): Promise<ToolProfiles<Tool>> {
  if (toolState.currentToolType === 'banner-two') {
    const profiles = await actions.getProfiles(TOOL_BANNER)
    return profiles
  }

  return await actions.getProfiles(toolState.currentToolType as Tool)
}

function setProfiles(profiles: ToolProfiles<Tool>) {
  if (toolState.currentToolType === 'banner-two') {
    actions.setProfiles(profiles as ToolProfiles<'banner'>)
  } else {
    const test = convertToConfigsLegacy(toolState.walletAddressId, profiles)

    toolActions.setConfigs(test)
  }
}

function getLegacyOptions(options: {
  profiles: ToolProfiles<Tool>
  profilesUpdate: ProfileId[]
}) {
  const { profiles, profilesUpdate } = options
  if (toolState.currentToolType === 'banner-two') {
    console.log('@@@ Getting legacy options for banner-two: ', profilesUpdate)
    return {
      hasConflicts: profilesUpdate.length > 0,
      updates: [...profilesUpdate],
      profiles,
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
  const { profiles, profilesUpdate } = useSnapshot(banner)
  console.log('@@@ log profilesUpdate: ', profilesUpdate.data)

  const connect = useCallback(async (): Promise<void> => {
    try {
      const fetchedProfiles = await getProfiles()
      const options = getLegacyOptions({
        profiles,
        profilesUpdate: profilesUpdate.data,
      })

      if (options.hasConflicts) {
        openDialog(
          <ProfilesDialog
            fetchedProfiles={fetchedProfiles}
            currentLocalProfiles={options.profiles}
            modifiedVersions={options.updates}
          />,
        )
        return
      }

      console.log('!!! Profiles fetched: ', fetchedProfiles)

      setProfiles(fetchedProfiles)
    } catch (err) {
      console.log('!!! Use connect wallet error: ', err)
      toolActions.setHasRemoteConfigs(false)
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
