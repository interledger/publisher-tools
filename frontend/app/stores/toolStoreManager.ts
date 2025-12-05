import type { ProfileId, BannerProfile, WidgetProfile } from '@shared/types'
import { createDataStoreBanner } from './bannerStore'
import { createDataStoreWidget } from './widgetStore'

export class StoreManager {
  private bannerStores: Record<ProfileId, BannerProfile> = {
    version1: createDataStoreBanner('Default profile 1'),
    version2: createDataStoreBanner('Default profile 2'),
    version3: createDataStoreBanner('Default profile 3')
  }

  private widgetStores: Record<ProfileId, WidgetProfile> = {
    version1: createDataStoreWidget('Default profile 1'),
    version2: createDataStoreWidget('Default profile 2'),
    version3: createDataStoreWidget('Default profile 3')
  }

  activeTab: ProfileId = 'version1'

  getBannerStore(key: ProfileId): BannerProfile {
    return this.bannerStores[key]
  }

  getWidgetStore(key: ProfileId): WidgetProfile {
    return this.widgetStores[key]
  }
}
