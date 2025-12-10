import { proxy } from 'valtio'
import { createDefaultBannerProfile } from '@shared/default-data'
import type { ProfileId, BannerProfile } from '@shared/types'

export const createDataStoreBanner = (profileName: string) =>
  proxy(createDefaultBannerProfile(profileName))

export class BannerStore {
  private stores: Record<ProfileId, BannerProfile> = {
    version1: createDataStoreBanner('Default profile 1'),
    version2: createDataStoreBanner('Default profile 2'),
    version3: createDataStoreBanner('Default profile 3')
  }

  activeTab: ProfileId = 'version1'

  getStore(key: ProfileId): BannerProfile {
    return this.stores[key]
  }
}
