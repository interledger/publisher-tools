import { createDataStoreBanner } from './bannerStore'
import { createDataStoreWidget } from './widgetStore'
import type { PresetId, BannerPreset, WidgetPreset } from '@shared/types'

export class StoreManager {
  private bannerStores: Record<PresetId, BannerPreset> = {
    version1: createDataStoreBanner('Default preset 1'),
    version2: createDataStoreBanner('Default preset 2'),
    version3: createDataStoreBanner('Default preset 3')
  }

  private widgetStores: Record<PresetId, WidgetPreset> = {
    version1: createDataStoreWidget('Default preset 1'),
    version2: createDataStoreWidget('Default preset 2'),
    version3: createDataStoreWidget('Default preset 3')
  }

  activeTab: PresetId = 'version1'

  getBannerStore(key: PresetId): BannerPreset {
    return this.bannerStores[key]
  }

  getWidgetStore(key: PresetId): WidgetPreset {
    return this.widgetStores[key]
  }
}
