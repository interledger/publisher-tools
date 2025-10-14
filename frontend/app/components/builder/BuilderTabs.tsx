import React from 'react'
import { BuilderPresetTabs } from '@/components'
import { toolState, toolActions, type StableKey } from '~/stores/toolStore'
import { useSnapshot } from 'valtio'

export function BuilderTabs({ children }: React.PropsWithChildren) {
  const snap = useSnapshot(toolState)

  const handleTabSelect = (stableKey: StableKey) => {
    toolActions.selectVersion(stableKey)
  }

  const handleTabLabelChange = (newLabel: string) => {
    toolState.currentConfig.versionName = newLabel
  }

  // derive tab options consistently from snapshot
  const tabOptions = toolActions.versionOptions.map(({ stableKey: id }) => ({
    id,
    label: snap.configurations[id].versionName,
    isDirty: snap.modifiedVersions.includes(id)
  }))

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
