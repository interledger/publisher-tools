import React, { useEffect } from 'react'
import {
  ContentBuilder,
  AppearanceBuilder,
  BuilderPresetTabs
} from '@/components'
import { useUI } from '~/stores/uiStore'
import type { ToolContent } from './ContentBuilder'
import type { ToolAppearance } from './AppearanceBuilder'
import { toolState, toolActions, type StableKey } from '~/stores/toolStore'

interface BuilderFormProps {
  content: ToolContent
  appearance: ToolAppearance
  toolName: 'widget' | 'banner'
  onRefresh: (section: 'appearance' | 'content') => void
  onBuildStepComplete?: (isComplete: boolean) => void
  positionSelector?: React.ReactNode
  colorsSelector?: React.ReactNode
}

export const BuilderForm: React.FC<BuilderFormProps> = ({
  onBuildStepComplete,
  onRefresh,
  content,
  appearance,
  toolName,
  positionSelector,
  colorsSelector
}) => {
  const { state: uiState } = useUI()
  const { modifiedVersions, activeVersion } = toolState

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
    return toolActions.versionOptions.map((option) => ({
      id: option.stableKey,
      label: option.versionName,
      isDirty: modifiedVersions.includes(option.stableKey)
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
        selectedId={activeVersion}
        onChange={handleTabSelect}
        onRename={handleTabLabelChange}
      >
        <ContentBuilder
          onRefresh={() => onRefresh('content')}
          content={content}
        />
        <AppearanceBuilder
          onRefresh={() => onRefresh('appearance')}
          appearance={appearance}
          positionSelector={positionSelector}
          colorsSelector={colorsSelector}
          toolName={toolName}
        />
      </BuilderPresetTabs>
    </div>
  )
}

export default BuilderForm
