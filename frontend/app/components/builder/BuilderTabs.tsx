import React from 'react'
import { useSnapshot } from 'valtio'
import { BuilderPresetTabs } from '@/components'
import { toolState, toolActions, type StableKey } from '~/stores/toolStore'

export function BuilderTabs({ children }: React.PropsWithChildren) {
  const snap = useSnapshot(toolState)

  const handleTabSelect = (profileId: StableKey) => {
    toolActions.handleTabSelect(profileId)
  }

  const handleTabLabelChange = (newLabel: string) => {
    toolActions.handleVersionNameChange(newLabel)
  }

  // derive tab options consistently from snapshot
  const tabOptions = toolActions.versionOptions.map(({ stableKey: id }) => ({
    id,
    label: snap.configurations[id].versionName,
    hasUpdates: snap.dirtyProfiles.has(id)
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
