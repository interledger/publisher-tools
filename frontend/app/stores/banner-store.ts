import { deepEqual } from 'fast-equals'
import { proxy, snapshot, subscribe, useSnapshot } from 'valtio'
import { proxySet } from 'valtio/utils'
import { createDefaultBannerProfile } from '@shared/default-data'
import {
  type ProfileId,
  type BannerProfile,
  type ToolProfiles,
  type Tool,
  PROFILE_IDS,
  DEFAULT_PROFILE_NAMES,
  TOOL_BANNER,
} from '@shared/types'
import type { SaveResult } from '~/lib/types'
import { getToolProfiles, saveToolProfile } from '~/utils/profile-api'
import { splitProfileProperties } from '~/utils/utils.storage'
import { toolState } from './toolStore'

export type BannerStore = ReturnType<typeof createBannerStore>
const STORAGE_KEY_PREFIX = 'wmt-banner'
const getStorageKey = (profileId: ProfileId) =>
  `${STORAGE_KEY_PREFIX}-${profileId}`
const SNAP_STORAGE_KEY = 'wmt-banner-snapshots'

const createProfileStoreBanner = (profileName: string) =>
  proxy(createDefaultBannerProfile(profileName))

function createBannerStore() {
  return proxy({
    profiles: Object.fromEntries(
      PROFILE_IDS.map((id) => [
        id,
        createProfileStoreBanner(DEFAULT_PROFILE_NAMES[id]),
      ]),
    ) as Record<ProfileId, BannerProfile>,
    profilesUpdate: proxySet<ProfileId>(),

    get profile(): BannerProfile {
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

export function useBannerProfile(options?: {
  sync: boolean
}): [BannerProfile, BannerProfile] {
  // https://github.com/pmndrs/valtio/issues/132
  const snapshot = useSnapshot(banner.profile, options)
  return [snapshot, banner.profile]
}

export const banner = createBannerStore()

const snapshots = new Map<ProfileId, BannerProfile>(
  PROFILE_IDS.map((id) => [
    id,
    createDefaultBannerProfile(DEFAULT_PROFILE_NAMES[id]),
  ]),
)

export const actions = {
  setProfileName(name: string) {
    banner.profiles[toolState.activeTab].$name = name
  },
  setProfiles(profiles: ToolProfiles<'banner'>) {
    if (!profiles) return
    Object.entries(profiles).forEach(([profileId, profile]) => {
      Object.assign(banner.profiles[profileId as ProfileId], profile)
    })
  },
  async getProfiles(tool: Tool): Promise<ToolProfiles<Tool>> {
    const { walletAddress } = toolState
    return await getToolProfiles(walletAddress, tool)
  },
  resetProfiles() {
    PROFILE_IDS.forEach((id) => {
      const profile = createDefaultBannerProfile(DEFAULT_PROFILE_NAMES[id])
      snapshots.set(id, profile)
      Object.assign(banner.profiles[id], profile)
    })
  },
  resetProfileSection(section: 'content' | 'appearance') {
    const snapshot = snapshots.get(toolState.activeTab)
    if (!snapshot) {
      throw new Error('No snapshot found for the profile')
    }

    const { content, appearance } = splitProfileProperties(snapshot)
    Object.assign(banner.profile, section === 'content' ? content : appearance)
  },
  async saveProfile(): Promise<SaveResult> {
    const profile = snapshot(banner.profile)
    const { walletAddress, activeTab } = toolState
    return await saveToolProfile(walletAddress, TOOL_BANNER, profile, activeTab)
  },
  commitProfile() {
    const profile = snapshot(banner.profile)
    snapshots.set(toolState.activeTab, profile)
    banner.profilesUpdate.delete(toolState.activeTab)

    const snaps = Object.fromEntries(snapshots.entries())
    localStorage.setItem(SNAP_STORAGE_KEY, JSON.stringify(snaps))
  },
  commitProfiles() {
    PROFILE_IDS.forEach((id) => {
      const profile = snapshot(banner.profiles[id])
      snapshots.set(id, profile)
      banner.profilesUpdate.delete(id)
    })

    const snaps = Object.fromEntries(snapshots.entries())
    localStorage.setItem(SNAP_STORAGE_KEY, JSON.stringify(snaps))
  },
}

export function subscribeProfilesToStorage() {
  PROFILE_IDS.forEach((profileId) => {
    subscribeProfileToStorage(profileId)
  })
}

export function hydrateProfilesFromStorage() {
  PROFILE_IDS.forEach((profileId) => {
    const parsed = parseProfileFromStorage(profileId)
    if (parsed) {
      Object.assign(banner.profiles[profileId], parsed)
    }
  })
}

function subscribeProfileToStorage(profileId: ProfileId) {
  const profile = banner.profiles[profileId]
  subscribe(profile, () => {
    const snap = snapshot(profile)
    localStorage.setItem(getStorageKey(profileId), JSON.stringify(snap))
  })
}

function parseProfileFromStorage(profileId: ProfileId): BannerProfile | null {
  const storageKey = getStorageKey(profileId)
  const storage = localStorage.getItem(storageKey)
  if (!storage) return null

  try {
    const profile: BannerProfile = JSON.parse(storage)
    const isValid =
      typeof profile === 'object' &&
      Object.keys(profile).every((key) => key in banner.profile)

    if (!isValid) throw new Error('Invalid profile shape')
    return profile
  } catch (error) {
    console.warn(
      `Failed to load profile ${profileId} from localStorage: `,
      error,
    )
    localStorage.removeItem(storageKey)
    return null
  }
}

export function captureSnapshotsToStorage() {
  const snap = snapshot(banner.profiles)
  Object.entries(snap).forEach(([profileId, profile]) => {
    snapshots.set(profileId as ProfileId, profile)
  })

  localStorage.setItem(SNAP_STORAGE_KEY, JSON.stringify(snap))
}

export function hydrateSnapshotsFromStorage() {
  const storage = localStorage.getItem(SNAP_STORAGE_KEY)
  if (!storage) return

  try {
    const stored: ToolProfiles<'banner'> = JSON.parse(storage)
    if (!stored) return

    const isValid = (profile: BannerProfile) =>
      typeof profile === 'object' &&
      Object.keys(profile).every((key) => key in banner.profile)

    Object.entries(stored).forEach(([id, profile]) => {
      if (isValid(profile)) {
        snapshots.set(id as ProfileId, profile)
      }
    })
  } catch (error) {
    console.warn('Failed to hydrate banner baselines:', error)
    localStorage.removeItem(SNAP_STORAGE_KEY)
  }
}

export function subscribeProfilesToUpdates() {
  PROFILE_IDS.forEach((profileId) => {
    subscribeProfileToUpdates(profileId)
  })
}

function subscribeProfileToUpdates(id: ProfileId) {
  const profile = banner.profiles[id]
  subscribe(profile, () => {
    const snap = snapshot(profile)
    if (checkForPendingUpdates(id, snap)) {
      banner.profilesUpdate.add(id)
    } else {
      banner.profilesUpdate.delete(id)
    }
  })
}

function checkForPendingUpdates(id: ProfileId, snap: BannerProfile): boolean {
  const baseline = snapshots.get(id)
  if (!baseline) {
    return false
  }

  return !deepEqual(snap, baseline)
}
