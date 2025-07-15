import React, { useState, useEffect } from 'react'
import { useSnapshot } from 'valtio'
import { BannerContentBuilder } from './BannerContentBuilder'
import { BuilderCollapseExpand } from './BuilderCollapseExpand'
import TabSelector from './TabSelector'
import { toolState, toolActions } from '~/stores/toolStore'

interface BuilderFormProps {
  className?: string
  onBuildStepComplete?: (isComplete: boolean) => void
}

export const BuilderForm: React.FC<BuilderFormProps> = ({
  className = '',
  onBuildStepComplete
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

  const handleTabSelect = (versionName: string) => {
    toolActions.selectVersion(versionName)
  }

  const handleTabLabelChange = (versionName: string, newLabel: string) => {
    toolActions.updateVersionLabel(versionName, newLabel)
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
      {/* Tab Selector */}
      <TabSelector
        options={snap.versionOptions.map((option) => ({
          id: option
        }))}
        selectedId={snap.selectedVersion}
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
        {/* Content Section - using BannerContentBuilder */}
        <div className="w-full">
          <BannerContentBuilder
            isComplete={contentComplete}
            isExpanded={expandedSection === 'content'}
            onToggle={handleContentToggle}
            onDone={handleContentDone}
          />
        </div>
        {/* Appearance Section - using BuilderCollapseExpand */}
        <div className="w-full">
          <BuilderCollapseExpand
            isComplete={appearanceComplete}
            isExpanded={expandedSection === 'appearance'}
            onToggle={handleAppearanceToggle}
            onDone={handleAppearanceDone}
          />
        </div>
      </div>
    </div>
  )
}

export default BuilderForm
