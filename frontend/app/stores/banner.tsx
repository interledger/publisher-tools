import { proxy } from 'valtio'
import { proxySet } from 'valtio/utils'
import { createDefaultBannerProfile } from '@shared/default-data'
import { type ProfileId, type BannerProfile, PROFILE_IDS } from '@shared/types'

export type BannerStore = ReturnType<typeof createBannerStore>

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
    getStore(profileId: ProfileId): BannerProfile {
      return this.profiles[profileId]
    },
    getProfileTabs() {
      return PROFILE_IDS.map((id) => ({
        id,
        label: this.profiles[id].$name,
        isDirty: this.dirtyProfiles.has(id)
      }))
    },
    setActiveTab(profileId: ProfileId) {
      this.activeTab = profileId
    },
    setProfileName(name: string) {
      this.profiles[this.activeTab].$name = name
    }
  })
}

export const banner = createBannerStore()

export const bannerActions = {
  handleBannerTabChange: (profileId: ProfileId) => {
    banner.setActiveTab(profileId)
  },

  handleBannerProfileNameChange: (name: string) => {
    banner.setProfileName(name)
  }
}
