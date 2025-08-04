import React, { useState, useEffect } from 'react'
import { ContentBuilder, AppearanceBuilder, TabSelector } from '@/components'
import { toolState, toolActions, type StableKey } from '~/stores/toolStore'
import { useSnapshot } from 'valtio'
import type { ToolContent } from './ContentBuilder'
import type { ToolAppearance } from './AppearanceBuilder'

interface BuilderFormProps {
  content: ToolContent
  appearance: ToolAppearance
  className?: string
  onBuildStepComplete?: (isComplete: boolean) => void
  positionSelector?: React.ReactNode
}

export const BuilderForm: React.FC<BuilderFormProps> = ({
  className = '',
  onBuildStepComplete,
  content,
  appearance,
  positionSelector
}) => {
  const snap = useSnapshot(toolState)
  const [expandedSection, setExpandedSection] = useState<
    'content' | 'appearance' | null
  >(null)
  const [contentComplete, setContentComplete] = useState(false)
  const [appearanceComplete, setAppearanceComplete] = useState(false)

  useEffect(() => {
    const bothComplete = contentComplete && appearanceComplete
    if (onBuildStepComplete) {
      onBuildStepComplete(bothComplete)
    }
  }, [contentComplete, appearanceComplete, onBuildStepComplete])

  const handleTabSelect = (stableKey: StableKey) => {
    toolActions.selectVersion(stableKey)
  }

  const handleTabLabelChange = (stableKey: StableKey, newLabel: string) => {
    toolActions.updateVersionLabel(stableKey, newLabel)
  }

  const handleContentToggle = () => {
    setExpandedSection(expandedSection === 'content' ? null : 'content')

    // mark content as complete after first toggle
    setContentComplete(true)
  }

  const handleAppearanceToggle = () => {
    setExpandedSection(expandedSection === 'appearance' ? null : 'appearance')

    // mark appearance as complete after first toggle
    setAppearanceComplete(true)
  }

  const handleContentDone = () => {
    setContentComplete(true)
    setExpandedSection(null)

    if (!appearanceComplete) {
      setExpandedSection('appearance')
    }
  }

  const handleAppearanceDone = () => {
    setAppearanceComplete(true)
    setExpandedSection(null)

    if (!contentComplete) {
      setExpandedSection('content')
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
            isComplete={contentComplete}
            isExpanded={expandedSection === 'content'}
            onToggle={handleContentToggle}
            onDone={handleContentDone}
            content={content}
          />
        </div>
        <div className="w-full">
          <AppearanceBuilder
            isComplete={appearanceComplete}
            isExpanded={expandedSection === 'appearance'}
            onToggle={handleAppearanceToggle}
            onDone={handleAppearanceDone}
            appearance={appearance}
            positionSelector={positionSelector}
          />
        </div>
      </div>
    </div>
  )
}

export default BuilderForm
