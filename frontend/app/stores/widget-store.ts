import { proxy, snapshot, useSnapshot } from 'valtio'
import { proxySet } from 'valtio/utils'
import { createDefaultWidgetProfile } from '@shared/default-data'
import {
  type ProfileId,
  type WidgetProfile,
  type ToolProfiles,
  type Tool,
  PROFILE_IDS,
  DEFAULT_PROFILE_NAMES,
  TOOL_WIDGET,
} from '@shared/types'
import type { SaveResult } from '~/lib/types'
import { getToolProfiles, saveToolProfile } from '~/utils/profile-api'
import { splitProfileProperties } from '~/utils/utils.storage'
import { createToolStoreUtils, getStorageKeys } from '~/utils/utilts.store'
import { toolState } from './toolStore'

export type WidgetStore = ReturnType<typeof createWidgetStore>

const createProfileStoreWidget = (profileName: string) =>
  proxy(createDefaultWidgetProfile(profileName))

function createWidgetStore() {
  return proxy({
    profiles: Object.fromEntries(
      PROFILE_IDS.map((id) => [
        id,
        createProfileStoreWidget(DEFAULT_PROFILE_NAMES[id]),
      ]),
    ) as Record<ProfileId, WidgetProfile>,
    profilesUpdate: proxySet<ProfileId>(),

    get profile(): WidgetProfile {
      return this.profiles[toolState.activeTab]
    },
    get profileTabs() {
      return PROFILE_IDS.map((id) => ({
        id,
        label: this.profiles[id].$name,
        hasUpdates: this.profilesUpdate.has(id),
      }))
    },
  })
}

export function useWidgetProfile(options?: {
  sync: boolean
}): [WidgetProfile, WidgetProfile] {
  const snapshot = useSnapshot(widget.profile, options)
  return [snapshot, widget.profile]
}

export const widget = createWidgetStore()

const snapshots = new Map<ProfileId, WidgetProfile>(
  PROFILE_IDS.map((id) => [
    id,
    createDefaultWidgetProfile(DEFAULT_PROFILE_NAMES[id]),
  ]),
)

const widgetStoreUtils = createToolStoreUtils({
  tool: TOOL_WIDGET,
  store: widget,
  snapshots,
})

const { snapshotsStorageKey } = getStorageKeys(TOOL_WIDGET)

export const actions = {
  setProfileName(name: string) {
    widget.profiles[toolState.activeTab].$name = name
  },
  setProfiles(profiles: ToolProfiles<'widget'>) {
    if (!profiles) return
    Object.entries(profiles).forEach(([profileId, profile]) => {
      Object.assign(widget.profiles[profileId as ProfileId], profile)
    })
  },
  async getProfiles(tool: Tool): Promise<ToolProfiles<Tool>> {
    const { walletAddress } = toolState
    return await getToolProfiles(walletAddress, tool)
  },
  resetProfiles() {
    PROFILE_IDS.forEach((id) => {
      const profile = createDefaultWidgetProfile(DEFAULT_PROFILE_NAMES[id])
      snapshots.set(id, profile)
      Object.assign(widget.profiles[id], profile)
    })
  },
  resetProfileSection(section: 'content' | 'appearance') {
    const snapshot = snapshots.get(toolState.activeTab)
    if (!snapshot) {
      throw new Error('No snapshot found for the profile')
    }

    const { content, appearance } = splitProfileProperties(snapshot)
    Object.assign(widget.profile, section === 'content' ? content : appearance)
  },
  async saveProfile(): Promise<SaveResult> {
    const profile = snapshot(widget.profile)
    const { walletAddress, activeTab } = toolState
    return await saveToolProfile(walletAddress, TOOL_WIDGET, profile, activeTab)
  },
  commitProfile() {
    const profile = snapshot(widget.profile)
    snapshots.set(toolState.activeTab, profile)
    widget.profilesUpdate.delete(toolState.activeTab)

    const snaps = Object.fromEntries(snapshots.entries())
    localStorage.setItem(snapshotsStorageKey, JSON.stringify(snaps))
  },
  commitProfiles() {
    PROFILE_IDS.forEach((id) => {
      const profile = snapshot(widget.profiles[id])
      snapshots.set(id, profile)
      widget.profilesUpdate.delete(id)
    })

    const snaps = Object.fromEntries(snapshots.entries())
    localStorage.setItem(snapshotsStorageKey, JSON.stringify(snaps))
  },
}

export const {
  subscribeProfilesToStorage,
  hydrateProfilesFromStorage,
  captureSnapshotsToStorage,
  hydrateSnapshotsFromStorage,
  subscribeProfilesToUpdates,
} = widgetStoreUtils
