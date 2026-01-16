import { useCallback } from 'react'
import { useSnapshot } from 'valtio'
import { ProfilesDialog, StatusDialog } from '@/components'
import { type Tool, type ToolProfiles, TOOL_BANNER } from '@shared/types'
import { useDialog } from '~/hooks/useDialog'
import { ApiError } from '~/lib/helpers'
import { actions, banner } from '~/stores/banner-store'
import { toolActions, toolState } from '~/stores/toolStore'
import { convertToConfigsLegacy } from '~/utils/profile-converter'

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

//TODO: refactor profiles dialog to support new profiles format type
function getLegacyOptions(options: {
  profiles: ToolProfiles<Tool>
  profilesUpdate: Set<string>
}) {
  const { profiles, profilesUpdate } = options
  if (toolState.currentToolType === 'banner-two') {
    return {
      conflicts: profilesUpdate.size > 0,
      updates: [...profilesUpdate],
      local: convertToConfigsLegacy(toolState.walletAddressId, profiles)
    }
  }
  return {
    conflicts: toolState.dirtyProfiles.size > 0,
    updates: [...toolState.dirtyProfiles],
    local: toolState.configurations
  }
}

export const useConnectWallet = () => {
  const [openDialog, closeDialog] = useDialog()
  const { profiles: l, profilesUpdate } = useSnapshot(banner)

  const connect = useCallback(
    async (walletAddress: string): Promise<void> => {
      try {
        const profiles = await getProfiles()
        const options = getLegacyOptions({
          profiles: l,
          profilesUpdate: new Set(profilesUpdate)
        })

        if (options.conflicts) {
          const legacy = convertToConfigsLegacy(walletAddress, profiles)
          openDialog(
            <ProfilesDialog
              fetchedConfigs={legacy}
              currentLocalConfigs={options.local}
              modifiedVersions={options.updates}
            />
          )
          return
        }

        console.log('!!! Profiles fetched: ', profiles)

        setProfiles(profiles)
      } catch (err) {
        console.log('!!! Use connect wallet error: ', err)
        //TODO: set has remote configs to false?
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
          />
        )
        throw err
      }
    },
    [openDialog]
  )

  return { connect }
}
