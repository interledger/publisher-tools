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
  className?: string
  onBuildStepComplete?: (isComplete: boolean) => void
  positionSelector?: React.ReactNode
  colorsSelector?: React.ReactNode
}

export const BuilderForm: React.FC<BuilderFormProps> = ({
  className = '',
  onBuildStepComplete,
  content,
  appearance,
  positionSelector,
  colorsSelector
}) => {
  const snap = useSnapshot(toolState)
  const { state: uiState, actions: uiActions } = useUI()

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

  const handleContentDone = () => {
    uiActions.setContentComplete(true)
    uiActions.setExpandedSection(null)

    if (!uiState.appearanceComplete) {
      uiActions.setExpandedSection('appearance')
    }
  }

  const handleAppearanceDone = () => {
    uiActions.setAppearanceComplete(true)
    uiActions.setExpandedSection(null)

    if (!uiState.contentComplete) {
      uiActions.setExpandedSection('content')
    }
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
        className={`
        bg-interface-bg-container
        rounded-b-sm
        p-md
        flex flex-col gap-md
        w-full
        ${className}
      `}
      >
        <div className="w-full">
          <ContentBuilder
            isComplete={uiState.contentComplete}
            onDone={handleContentDone}
            content={content}
            activeVersion={snap.activeVersion}
          />
        </div>
        <div className="w-full">
          <AppearanceBuilder
            isComplete={uiState.appearanceComplete}
            onDone={handleAppearanceDone}
            appearance={appearance}
            positionSelector={positionSelector}
            colorsSelector={colorsSelector}
            activeVersion={snap.activeVersion}
          />
        </div>
      </div>
    </div>
  )
}

export default BuilderForm
