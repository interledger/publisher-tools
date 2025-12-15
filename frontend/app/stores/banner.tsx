import { proxy, snapshot, subscribe, useSnapshot } from 'valtio'
import { proxySet } from 'valtio/utils'
import { createDefaultBannerProfile } from '@shared/default-data'
import {
  type ProfileId,
  type BannerProfile,
  type Configuration,
  PROFILE_IDS
} from '@shared/types'

export type BannerStore = ReturnType<typeof createBannerStore>
const STORAGE_KEY_PREFIX = 'wmt-banner'
const getStorageKey = (profileId: ProfileId) =>
  `${STORAGE_KEY_PREFIX}-${profileId}`

const createProfileStoreBanner = (profileName: string) =>
  proxy(createDefaultBannerProfile(profileName))

function createBannerStore() {
  return proxy({
    profiles: {
      version1: createProfileStoreBanner('Default profile 1'),
      version2: createProfileStoreBanner('Default profile 2'),
      version3: createProfileStoreBanner('Default profile 3')
    } as Record<ProfileId, BannerProfile>,
    activeTab: 'version1' as ProfileId,
    dirtyProfiles: proxySet<ProfileId>(),

    get profile(): BannerProfile {
      return this.profiles[this.activeTab]
    },
    get profileTabs() {
      return PROFILE_IDS.map((id) => ({
        id,
        label: this.profiles[id].$name,
        isDirty: this.dirtyProfiles.has(id)
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
PROFILE_IDS.forEach((id) => subscribeProfileToStorage(id))

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

export function hydrateProfilesFromStorage() {
  PROFILE_IDS.forEach((profileId) => {
    const parsed = parseProfileFromStorage(profileId)
    if (parsed) Object.assign(banner.profiles[profileId], parsed)
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
