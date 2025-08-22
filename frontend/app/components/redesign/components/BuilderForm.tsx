import React, { useEffect } from 'react'
import { ContentBuilder, AppearanceBuilder, TabSelector } from '@/components'
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

  const handleTabLabelChange = (stableKey: StableKey, newLabel: string) => {
    toolActions.updateVersionLabel(stableKey, newLabel)
  }

  return (
    <div className="flex flex-col">
      <TabSelector
        options={toolActions.versionOptions.map((option) => ({
          id: option.stableKey
        }))}
        selectedId={snap.activeVersion}
        onSelectTab={handleTabSelect}
        onTabLabelChange={handleTabLabelChange}
      />
      <div
        className="bg-interface-bg-container rounded-b-sm p-md flex flex-col gap-md w-full"
        key={snap.activeVersion}
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
      </div>
    </div>
  )
}

export default BuilderForm
