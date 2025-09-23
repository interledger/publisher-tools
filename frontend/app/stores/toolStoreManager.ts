import { createDataStoreBanner, type BannerStoreType } from './bannerStore'
import { createDataStoreWidget, type WidgetStoreType } from './widgetStore'
import type { PresetIds } from '@shared/types'

export class StoreManager {
  private bannerStores: Record<PresetIds, BannerStoreType> = {
    a: createDataStoreBanner('Banner preset 1'),
    b: createDataStoreBanner('Banner preset 2'),
    c: createDataStoreBanner('Banner preset 3')
  }

  private widgetStores: Record<PresetIds, WidgetStoreType> = {
    a: createDataStoreWidget('Widget preset 1'),
    b: createDataStoreWidget('Widget preset 2'),
    c: createDataStoreWidget('Widget preset 3')
  }

  activeTab: PresetIds = 'a'

  getBannerStore(key: PresetIds): BannerStoreType {
    return this.bannerStores[key]
  }

  getWidgetStore(key: PresetIds): WidgetStoreType {
    return this.widgetStores[key]
  }
}
