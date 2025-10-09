import React, { useEffect } from 'react'
import { BuilderPresetTabs } from '@/components'
import { toolState, toolActions, type StableKey } from '~/stores/toolStore'
import { useUI } from '~/stores/uiStore'
import { useSnapshot } from 'valtio'

interface Props {
  onBuildStepComplete: (isComplete: boolean) => void
}

export function BuilderTabs({
  onBuildStepComplete,
  children
}: React.PropsWithChildren<Props>) {
  const snap = useSnapshot(toolState)
  const { state: uiState } = useUI()

  useEffect(() => {
    const bothComplete = uiState.contentComplete && uiState.appearanceComplete
    if (onBuildStepComplete) {
      onBuildStepComplete(bothComplete)
    }
  }, [uiState.contentComplete, uiState.appearanceComplete, onBuildStepComplete])

  const handleTabSelect = (stableKey: StableKey) => {
    toolActions.selectVersion(stableKey)
  }

  const getLatestTabOptions = () => {
    return toolActions.versionOptions.map(({ stableKey: id }) => ({
      id,
      label: toolState.configurations[id].versionName,
      isDirty: toolState.modifiedVersions.includes(id)
    }))
  }
  const [tabOptions, setTabOptions] = React.useState(getLatestTabOptions)
  const handleTabLabelChange = (stableKey: StableKey, newLabel: string) => {
    toolActions.updateVersionLabel(stableKey, newLabel)
    setTabOptions(() => getLatestTabOptions())
  }

  useEffect(() => {
    setTabOptions(() => getLatestTabOptions())
  }, [
    toolState.isSubmitting,
    toolState.currentConfig.walletAddress,
    toolState.currentConfig.versionName
  ])

  return (
    <div className="flex flex-col mt-4">
      <BuilderPresetTabs
        idPrefix="presets"
        options={tabOptions}
        selectedId={snap.activeVersion}
        onChange={handleTabSelect}
        onRename={handleTabLabelChange}
      >
        {children}
      </BuilderPresetTabs>
    </div>
  )
}
