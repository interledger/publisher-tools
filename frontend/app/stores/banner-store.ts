import { deepEqual } from 'fast-equals'
import { proxy, snapshot, subscribe, useSnapshot } from 'valtio'
import { proxySet, subscribeKey } from 'valtio/utils'
import { createDefaultBannerProfile } from '@shared/default-data'
import {
  type ProfileId,
  type BannerProfile,
  type Configuration,
  PROFILE_IDS,
  DEFAULT_PROFILE_NAMES
} from '@shared/types'
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
        createProfileStoreBanner(DEFAULT_PROFILE_NAMES[id])
      ])
    ) as Record<ProfileId, BannerProfile>,
    activeTab: 'version1' as ProfileId,
    profilesUpdate: proxySet<ProfileId>(),

    get profile(): BannerProfile {
      return this.profiles[this.activeTab]
    },
    get profileTabs() {
      return PROFILE_IDS.map((id) => ({
        id,
        label: this.profiles[id].$name,
        hasUpdates: this.profilesUpdate.has(id)
      }))
    }
  })
}

export function useBannerProfile(options?: {
  sync: boolean
}): [BannerProfile, BannerProfile] {
  // https://github.com/pmndrs/valtio/issues/132
  const snapshot = useSnapshot(banner, options).profile
  return [snapshot, banner.profile]
}

export const banner = createBannerStore()

const snapshots = new Map<ProfileId, BannerProfile>(
  PROFILE_IDS.map((id) => [
    id,
    createDefaultBannerProfile(DEFAULT_PROFILE_NAMES[id])
  ])
)

export const actions = {
  setActiveTab(profileId: ProfileId) {
    banner.activeTab = profileId
  },
  setProfileName(name: string) {
    banner.profiles[banner.activeTab].$name = name
  },
  setProfiles(config: Configuration<'banner'>) {
    Object.entries(config).forEach(([profileId, profile]) => {
      Object.assign(banner.profiles[profileId as ProfileId], profile)
    })
  }
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
      `Failed to load profile ${profileId} from localStorage:`,
      error
    )
    localStorage.removeItem(storageKey)
    return null
  }
}

export function subscribeSnapshotsToStorage() {
  subscribeKey(toolState, `isWalletConnected`, () => {
    const snap = snapshot(banner).profiles

    Object.entries(snap).forEach(([profileId, profile]) => {
      snapshots.set(profileId as ProfileId, profile)
    })

    localStorage.setItem(SNAP_STORAGE_KEY, JSON.stringify(snap))
  })
}

export function hydrateSnapshotsFromStorage() {
  const storage = localStorage.getItem(SNAP_STORAGE_KEY)
  if (!storage) return

  try {
    const stored: Configuration<'banner'> = JSON.parse(storage)

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
