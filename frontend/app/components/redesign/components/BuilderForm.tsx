import React, { useEffect } from 'react'
import {
  ContentBuilder,
  AppearanceBuilder,
  BuilderPresetTabs
} from '@/components'
import { toolState, toolActions, type StableKey } from '~/stores/toolStore'
import { useUI } from '~/stores/uiStore'
import { useSnapshot } from 'valtio'
import type { ContentConfig, ToolContent } from './ContentBuilder'
import type { AppearanceConfig, ToolAppearance } from './AppearanceBuilder'

interface BuilderFormProps {
  profile: ToolContent | ToolAppearance
  config: ContentConfig | AppearanceConfig
  onRefresh: (section: 'appearance' | 'content') => void
  onBuildStepComplete?: (isComplete: boolean) => void
  positionSelector?: React.ReactNode
  colorsSelector?: React.ReactNode
}

export const BuilderForm: React.FC<BuilderFormProps> = ({
  onBuildStepComplete,
  onRefresh,
  profile,
  config,
  positionSelector,
  colorsSelector
}) => {
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
        <ContentBuilder
          onRefresh={() => onRefresh('content')}
          profile={profile as ToolContent}
          config={config as ContentConfig}
        />
        <AppearanceBuilder
          onRefresh={() => onRefresh('appearance')}
          profile={profile as ToolAppearance}
          positionSelector={positionSelector}
          colorsSelector={colorsSelector}
          config={config as AppearanceConfig}
        />
      </BuilderPresetTabs>
    </div>
  )
}

export default BuilderForm
