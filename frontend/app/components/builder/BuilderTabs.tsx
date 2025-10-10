import React, { useEffect } from 'react'
import { BuilderPresetTabs } from '@/components'
import { toolState, toolActions, type StableKey } from '~/stores/toolStore'
import { useSnapshot } from 'valtio'
import { useUIState } from '~/stores/uiStore'

export function BuilderTabs({ children }: React.PropsWithChildren) {
  const snap = useSnapshot(toolState)
  const { buildStepComplete } = useUIState()

  const handleTabSelect = (stableKey: StableKey) => {
    toolActions.selectVersion(stableKey)
  }

  const handleTabLabelChange = (stableKey: StableKey, newLabel: string) => {
    toolState.configurations[stableKey].versionName = newLabel
  }

  // derive tab options directly from valtio state
  const tabOptions = toolActions.versionOptions.map(({ stableKey: id }) => ({
    id,
    label: snap.configurations[id].versionName,
    isDirty: snap.modifiedVersions.includes(id)
  }))

  useEffect(() => {
    toolActions.setBuildCompleteStep(buildStepComplete ? 'filled' : 'unfilled')
  }, [buildStepComplete])

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
