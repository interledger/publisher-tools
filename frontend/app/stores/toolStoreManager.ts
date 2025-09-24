import { createDataStoreBanner } from './bannerStore'
import { createDataStoreWidget } from './widgetStore'
import type { BannerConfig, PresetIds, WidgetConfig } from '@shared/types'

export class StoreManager {
  private bannerStores: Record<PresetIds, BannerConfig> = {
    version1: createDataStoreBanner('Default preset 1'),
    version2: createDataStoreBanner('Default preset 2'),
    version3: createDataStoreBanner('Default preset 3')
  }

  private widgetStores: Record<PresetIds, WidgetConfig> = {
    version1: createDataStoreWidget('Default preset 1'),
    version2: createDataStoreWidget('Default preset 2'),
    version3: createDataStoreWidget('Default preset 3')
  }

  activeTab: PresetIds = 'version1'

  getBannerStore(key: PresetIds): BannerConfig {
    return this.bannerStores[key]
  }

  getWidgetStore(key: PresetIds): WidgetConfig {
    return this.widgetStores[key]
  }
}
