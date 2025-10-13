import React from 'react'
import { BuilderPresetTabs } from '@/components'
import { toolState, toolActions, type StableKey } from '~/stores/toolStore'
import { snapshot } from 'valtio'

export function BuilderTabs({ children }: React.PropsWithChildren) {
  const snap = snapshot(toolState)

  const handleTabSelect = (stableKey: StableKey) => {
    toolActions.selectVersion(stableKey)
  }

  const handleTabLabelChange = (stableKey: StableKey, newLabel: string) => {
    toolState.configurations[stableKey].versionName = newLabel
  }

  // derive tab options directly from valtio state
  const tabOptions = toolActions.versionOptions.map(
    ({ stableKey: id, versionName }) => ({
      id,
      label: versionName,
      isDirty: snap.modifiedVersions.includes(id)
    })
  )

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
