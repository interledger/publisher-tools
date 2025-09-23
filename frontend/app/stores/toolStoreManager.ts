import { createDataStoreBanner, type BannerStoreType } from './bannerStore'
import { createDataStoreWidget, type WidgetStoreType } from './widgetStore'
import type { StableKey } from './toolStore'

export class StoreManager {
  private bannerStores: Record<StableKey, BannerStoreType> = {
    version1: createDataStoreBanner(),
    version2: createDataStoreBanner(),
    version3: createDataStoreBanner()
  }

  private widgetStores: Record<StableKey, WidgetStoreType> = {
    version1: createDataStoreWidget(),
    version2: createDataStoreWidget(),
    version3: createDataStoreWidget()
  }

  activeTab: StableKey = 'version1'

  getBannerStore(key: StableKey): BannerStoreType {
    return this.bannerStores[key]
  }

  getWidgetStore(key: StableKey): WidgetStoreType {
    return this.widgetStores[key]
  }
}
