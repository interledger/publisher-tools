import { proxy, subscribe, useSnapshot } from 'valtio'
import { proxySet } from 'valtio/utils'
import { createDefaultBannerProfile } from '@shared/default-data'
import {
  type ProfileId,
  type BannerProfile,
  type Configuration,
  PROFILE_IDS
} from '@shared/types'

export type BannerStore = ReturnType<typeof createBannerStore>
const STORAGE_KEY = 'wmt-banner-store'

const createDataStoreBanner = (profileName: string) =>
  proxy(createDefaultBannerProfile(profileName))

function createBannerStore() {
  return proxy({
    profiles: {
      version1: createDataStoreBanner('Default profile 1'),
      version2: createDataStoreBanner('Default profile 2'),
      version3: createDataStoreBanner('Default profile 3')
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

export const actions = {
  setActiveTab(profileId: ProfileId) {
    banner.activeTab = profileId
  },
  setProfileName(name: string) {
    banner.profiles[banner.activeTab].$name = name
  },
  setProfiles(config: Configuration<'banner'>) {
    Object.entries(config).forEach(([profileId, profile]) => {
      banner.profiles[profileId as ProfileId] = profile
    })
  }
}

export function subscribeStoreToStorage() {
  subscribe(banner, () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...banner,
        dirtyProfiles: Array.from(banner.dirtyProfiles)
      })
    )
  })
}

export function hydrateStoreFromStorage(): BannerStore | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const store: BannerStore = JSON.parse(saved)
      const validKeys =
        typeof store === 'object' &&
        Object.keys(store).every((key) => key in banner)

      if (validKeys) {
        const loadedData = {
          ...store,
          dirtyProfiles: proxySet<ProfileId>(
            Array.isArray(store.dirtyProfiles) ? store.dirtyProfiles : []
          )
        }
        Object.assign(banner, loadedData)
      } else {
        throw new Error('saved configuration not valid')
      }
    }
  } catch (error) {
    console.warn(`Failed to load store from localStorage:`, error)
    localStorage.removeItem(STORAGE_KEY)
  }

  return null
}
