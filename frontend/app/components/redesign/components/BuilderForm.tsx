import React, { useEffect } from 'react'
import {
  ContentBuilder,
  AppearanceBuilder,
  BuilderPresetTabs
} from '@/components'
import { toolState, toolActions, type StableKey } from '~/stores/toolStore'
import { useUI } from '~/stores/uiStore'
import { useSnapshot } from 'valtio'
import type { ToolContent } from './ContentBuilder'
import type { ToolAppearance } from './AppearanceBuilder'

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
  }, [toolState.isSubmitting, toolState.currentConfig.walletAddress])

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
