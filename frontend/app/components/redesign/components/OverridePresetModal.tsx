import React, { useState } from 'react'
import { SVGSpinner } from '@/assets'
import {
  ConfigCondition,
  ToolsPrimaryButton,
  ToolsSecondaryButton
} from '@/components'
import type { ElementConfigType } from '@shared/types'
import { useDialog } from '~/hooks/useDialog'
import { toolActions } from '~/stores/toolStore'
import { useUIActions } from '~/stores/uiStore'
import { BaseModal } from './modals/BaseModal'

interface OverridePresetModalProps {
  fetchedConfigs: Record<string, ElementConfigType>
  currentLocalConfigs?: Record<string, ElementConfigType>
  modifiedVersions?: readonly string[]
}

export const OverridePresetModal: React.FC<OverridePresetModalProps> = ({
  fetchedConfigs,
  currentLocalConfigs,
  modifiedVersions = []
}) => {
  const [isOverriding, setIsOverriding] = useState(false)
  const uiActions = useUIActions()
  const [, closeDialog] = useDialog()
  const generatedConfigs = React.useMemo(() => {
    if (!fetchedConfigs || !currentLocalConfigs) {
      return []
    }

    const localStableKeys = Object.keys(currentLocalConfigs)
    const fetchedStableKeys = Object.keys(fetchedConfigs)

    const truncateTitle = (title: string, maxLength: number = 20) => {
      return title.length > maxLength
        ? `${title.substring(0, maxLength)}...`
        : title
    }

    return localStableKeys.map((localStableKey, index) => {
      const localConfig = currentLocalConfigs[localStableKey]
      const currentTitle = truncateTitle(localConfig.versionName)

      let databaseStableKey = localStableKey
      let databaseTitle = ''

      if (fetchedConfigs[localStableKey]) {
        // exact stable key match found
        databaseTitle = truncateTitle(
          fetchedConfigs[localStableKey].versionName
        )
      } else {
        databaseStableKey =
          fetchedStableKeys[index] || fetchedStableKeys[0] || localStableKey
        const databaseConfig = fetchedConfigs[databaseStableKey]
        databaseTitle = databaseConfig
          ? truncateTitle(databaseConfig.versionName)
          : 'No database version'
      }

      const isModified = modifiedVersions.includes(localStableKey)
      const canOverride =
        isModified && fetchedConfigs[databaseStableKey] !== undefined

      const configItem = {
        id: localStableKey,
        number: index + 1,
        title: currentTitle,
        hasLocalChanges: isModified,
        presetName: databaseTitle,
        hasEdits: canOverride
      }

      return configItem
    })
  }, [fetchedConfigs, currentLocalConfigs, modifiedVersions])

  const [selectedConfigs, setSelectedConfigs] = useState<string[]>(() => {
    // initially select only configurations that have local modifications
    const modifiedVersionsWithEdits = generatedConfigs.filter(
      (config) => config.hasEdits
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
      // build the selected LOCAL configurations (the ones user wants to keep)
      const selectedLocalConfigs: Record<string, ElementConfigType> = {}

      selectedConfigs.forEach((localStableKey) => {
        if (currentLocalConfigs && currentLocalConfigs[localStableKey]) {
          selectedLocalConfigs[localStableKey] =
            currentLocalConfigs[localStableKey]
        } else {
          console.warn(
            `No local configuration found for stable key: ${localStableKey}`
          )
        }
      })

      toolActions.overrideWithFetchedConfigs(
        selectedLocalConfigs,
        fetchedConfigs
      )
      await toolActions.saveConfig('save-success')
    } catch (error) {
      console.error('Error overriding configurations:', error)
    } finally {
      setIsOverriding(false)
    }
  }

  return (
    <BaseModal
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
          disabled={!fetchedConfigs || isOverriding}
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
    </BaseModal>
  )
}

export default OverridePresetModal
