import React, { useState } from 'react'
import { SVGSpinner } from '@/assets'
import {
  ConfigCondition,
  ToolsPrimaryButton,
  ToolsSecondaryButton,
} from '@/components'
import type { ProfileId, Tool, ToolProfiles } from '@shared/types'
import { PROFILE_IDS } from '@shared/types'
import { useDialog } from '~/hooks/useDialog'
import { useSaveConfig } from '~/hooks/useSaveConfig'
import { actions as bannerActions } from '~/stores/banner-store'
import { toolActions, toolState } from '~/stores/toolStore'
import { useUIActions } from '~/stores/uiStore'
import { convertToConfigsLegacy } from '~/utils/profile-converter'
import { BaseDialog } from './BaseDialog'

// Use Record for flexible indexing while maintaining type safety
// type ProfilesRecord = Record<ProfileId, ToolProfile<Tool> | undefined>

interface Props {
  fetchedProfiles?: ToolProfiles<Tool>
  currentLocalProfiles?: ToolProfiles<Tool>
  modifiedVersions?: readonly string[]
}

export const ProfilesDialog: React.FC<Props> = ({
  fetchedProfiles,
  currentLocalProfiles,
  modifiedVersions = [],
}) => {
  const [isOverriding, setIsOverriding] = useState(false)
  const uiActions = useUIActions()
  const { saveLastAction } = useSaveConfig()
  const [, closeDialog] = useDialog()

  const generatedConfigs = React.useMemo(() => {
    if (!fetchedProfiles || !currentLocalProfiles) {
      return []
    }

    const localProfileIds = PROFILE_IDS.filter((id) => currentLocalProfiles[id])
    const fetchedProfileIds = PROFILE_IDS.filter((id) => fetchedProfiles[id])

    const truncateTitle = (title: string, maxLength: number = 20) => {
      return title.length > maxLength
        ? `${title.substring(0, maxLength)}...`
        : title
    }

    return localProfileIds.map((profileId, index) => {
      const localProfile = currentLocalProfiles[profileId]
      const currentTitle = truncateTitle(localProfile?.$name ?? 'Unknown')

      let databaseProfileId: ProfileId = profileId
      let databaseTitle = ''

      if (fetchedProfiles[profileId]) {
        // exact profile id match found
        const fetchedProfile = fetchedProfiles[profileId]
        databaseTitle = truncateTitle(fetchedProfile?.$name ?? 'Unknown')
      } else {
        databaseProfileId =
          fetchedProfileIds[index] || fetchedProfileIds[0] || profileId
        const databaseProfile = fetchedProfiles[databaseProfileId]
        databaseTitle = databaseProfile
          ? truncateTitle(databaseProfile.$name)
          : 'No database version'
      }

      const isModified = modifiedVersions.includes(profileId)
      const canOverride =
        isModified && fetchedProfiles[databaseProfileId] !== undefined

      return {
        id: profileId,
        number: index + 1,
        title: currentTitle,
        hasLocalChanges: isModified,
        presetName: databaseTitle,
        hasEdits: canOverride,
      }
    })
  }, [fetchedProfiles, currentLocalProfiles, modifiedVersions])

  const [selectedConfigs, setSelectedConfigs] = useState<string[]>(() => {
    // initially select only configurations that have local modifications
    const modifiedVersionsWithEdits = generatedConfigs.filter(
      (config) => config.hasEdits,
    )
    return modifiedVersionsWithEdits.map((config) => config.id)
  })

  const onAddWalletAddress = () => {
    toolActions.setWalletConnected(false)
    toolActions.setHasRemoteConfigs(false)
    uiActions.focusWalletInput()
    closeDialog()
  }

  const handleConfigSelection = (configId: string, checked: boolean) => {
    setSelectedConfigs((prev) => {
      if (checked) {
        if (prev.includes(configId)) return prev
        return [...prev, configId]
      } else {
        return prev.filter((id) => id !== configId)
      }
    })
  }

  const handleOverride = async () => {
    setIsOverriding(true)
    try {
      if (!fetchedProfiles) {
        throw new Error('Failed to fetch remote configurations')
      }

      const mergedProfiles: ToolProfiles<Tool> = {}

      PROFILE_IDS.forEach((profileId) => {
        if (!fetchedProfiles[profileId]) return

        const keepLocal = selectedConfigs.includes(profileId)
        if (keepLocal && currentLocalProfiles?.[profileId]) {
          mergedProfiles[profileId] = currentLocalProfiles[profileId]
        } else {
          mergedProfiles[profileId] = fetchedProfiles[profileId]
        }
      })

      // Apply merged profiles based on current tool type
      if (toolState.currentToolType === 'banner-two') {
        bannerActions.setProfiles(mergedProfiles as ToolProfiles<'banner'>)
      } else {
        toolActions.setConfigs(
          convertToConfigsLegacy(
            toolState.walletAddressId,
            mergedProfiles as ToolProfiles<Tool>,
          ),
        )
      }

      await saveLastAction()
      toolActions.setHasRemoteConfigs(true)
      toolActions.setWalletConnected(true)
      closeDialog()
    } catch (error) {
      console.error('Error overriding configurations:', error)
    } finally {
      setIsOverriding(false)
    }
  }

  return (
    <BaseDialog
      className="pt-4xl pb-md px-0
        flex flex-col items-center gap-lg w-[514px]"
    >
      <div className="px-md w-full text-center">
        <div className="text-style-body-standard space-y-2xs">
          <p>We found previous edits correlated to this wallet address.</p>
          <p>Choose configurations to keep:</p>
        </div>
      </div>

      <div className="flex flex-col gap-2xs px-md w-full">
        <div className="bg-silver-50 rounded-sm p-sm">
          <div className="flex items-center text-style-small-standard text-text-secondary">
            <span className="w-[50px] mr-md">Tab</span>
            <span className="w-[150px] mr-md">Current version</span>
            <span className="w-[70px] text-center mr-md">Override</span>
            <span className="w-[140px]">Saved version</span>
          </div>
        </div>

        {generatedConfigs.map((config) => (
          <ConfigCondition
            key={config.id}
            id={config.id}
            number={config.number}
            title={config.title}
            hasLocalChanges={config.hasLocalChanges}
            presetName={config.presetName}
            checked={selectedConfigs.includes(config.id)}
            onCheckedChange={(checked) =>
              handleConfigSelection(config.id, checked)
            }
            disabled={!config.hasEdits}
            className={!config.hasEdits ? 'opacity-50' : ''}
          />
        ))}
      </div>

      <div className="w-full px-md flex flex-col gap-xs">
        <ToolsPrimaryButton
          className="w-full h-12 rounded-sm bg-primary-bg hover:bg-primary-bg-hover text-white"
          onClick={handleOverride}
          disabled={!fetchedProfiles || isOverriding}
        >
          <div className="flex items-center justify-center gap-2">
            {isOverriding && <SVGSpinner className="w-4 h-4" />}
            <span>
              {isOverriding
                ? 'Overriding and saving...'
                : selectedConfigs.length > 0
                  ? `Override ${selectedConfigs.length} local configuration${selectedConfigs.length > 1 ? 's' : ''} and save`
                  : 'Keep all saved edits and save'}
            </span>
          </div>
        </ToolsPrimaryButton>
      </div>

      <div className="px-md w-full text-center">
        <p className="text-style-body-standard max-w-[394px] mx-auto">
          Would you like to use a different wallet address?
        </p>
      </div>

      <div className="w-full px-md">
        <ToolsSecondaryButton
          className="w-full h-12 rounded-sm border border-secondary-edge text-text-buttons-default hover:border-secondary-edge-hover hover:text-secondary-edge-hover"
          onClick={onAddWalletAddress}
        >
          Add another wallet address
        </ToolsSecondaryButton>
      </div>
    </BaseDialog>
  )
}
