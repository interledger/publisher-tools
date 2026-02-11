import { proxy, snapshot, useSnapshot } from 'valtio'
import { proxySet } from 'valtio/utils'
import { createDefaultOfferwallProfile } from '@shared/default-data'
import {
  type ProfileId,
  type OfferwallProfile,
  type ToolProfiles,
  PROFILE_IDS,
  DEFAULT_PROFILE_NAMES,
  TOOL_OFFERWALL,
} from '@shared/types'
import type { SaveResult } from '~/lib/types'
import { getToolProfiles } from '~/utils/profile-api'
import { patchProxy } from '~/utils/utils.storage'
import { createToolStoreUtils, getStorageKeys } from '~/utils/utilts.store'
import { toolState } from './toolStore'

export type OfferwallStore = ReturnType<typeof createOfferwallStore>

const createProfileStoreOfferwall = (profileName: string) =>
  proxy(createDefaultOfferwallProfile(profileName))

function createOfferwallStore() {
  return proxy({
    profiles: Object.fromEntries(
      PROFILE_IDS.map((id) => [
        id,
        createProfileStoreOfferwall(DEFAULT_PROFILE_NAMES[id]),
      ]),
    ) as Record<ProfileId, OfferwallProfile>,
    profilesUpdate: proxySet<ProfileId>(),

    get profile(): OfferwallProfile {
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

export function useOfferwallProfile(options?: {
  sync: boolean
}): [OfferwallProfile, OfferwallProfile] {
  // https://github.com/pmndrs/valtio/issues/132
  const snapshot = useSnapshot(offerwall.profile, options)
  return [snapshot, offerwall.profile]
}

export const offerwall = createOfferwallStore()

const snapshots = new Map<ProfileId, OfferwallProfile>(
  PROFILE_IDS.map((id) => [
    id,
    createDefaultOfferwallProfile(DEFAULT_PROFILE_NAMES[id]),
  ]),
)

const offerwallStoreUtils = createToolStoreUtils({
  tool: TOOL_OFFERWALL,
  store: offerwall,
  snapshots,
})

const { snapshotsStorageKey } = getStorageKeys(TOOL_OFFERWALL)

export const actions = {
  setProfileName(name: string) {
    offerwall.profiles[toolState.activeTab].$name = name
  },
  setProfiles(profiles: ToolProfiles<'offerwall'>) {
    if (!profiles) return
    Object.entries(profiles).forEach(([profileId, profile]) => {
      Object.assign(offerwall.profiles[profileId as ProfileId], profile)
    })
  },
  async getProfiles(
    tool: typeof TOOL_OFFERWALL,
  ): Promise<ToolProfiles<'offerwall'>> {
    const { walletAddress } = toolState
    return await getToolProfiles(walletAddress, tool)
  },
  resetProfiles() {
    PROFILE_IDS.forEach((id) => {
      const profile = createDefaultOfferwallProfile(DEFAULT_PROFILE_NAMES[id])
      snapshots.set(id, profile)
      Object.assign(offerwall.profiles[id], profile)
    })
  },
  resetProfileSection() {
    const snapshot = snapshots.get(toolState.activeTab)
    if (!snapshot) {
      throw new Error('No snapshot found for the profile')
    }

    patchProxy(offerwall.profile, snapshot)
  },
  async saveProfile(): Promise<SaveResult> {
    //TODO
    return { success: true }
  },
  commitProfile() {
    const profile = snapshot(offerwall.profile)
    snapshots.set(toolState.activeTab, profile)
    offerwall.profilesUpdate.delete(toolState.activeTab)

    const snaps = Object.fromEntries(snapshots.entries())
    localStorage.setItem(snapshotsStorageKey, JSON.stringify(snaps))
  },
  commitProfiles() {
    PROFILE_IDS.forEach((id) => {
      const profile = snapshot(offerwall.profiles[id])
      snapshots.set(id, profile)
      offerwall.profilesUpdate.delete(id)
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
} = offerwallStoreUtils
