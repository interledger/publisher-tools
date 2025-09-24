import { createDataStoreBanner } from './bannerStore'
import { createDataStoreWidget } from './widgetStore'
import type { BannerConfig, PresetIds, WidgetConfig } from '@shared/types'

export class StoreManager {
  private bannerStores: Record<PresetIds, BannerConfig> = {
    a: createDataStoreBanner('Default preset 1'),
    b: createDataStoreBanner('Default preset 2'),
    c: createDataStoreBanner('Default preset 3')
  }

  private widgetStores: Record<PresetIds, WidgetConfig> = {
    a: createDataStoreWidget('Default preset 1'),
    b: createDataStoreWidget('Default preset 2'),
    c: createDataStoreWidget('Default preset 3')
  }

  activeTab: PresetIds = 'a'

  getBannerStore(key: PresetIds): BannerConfig {
    return this.bannerStores[key]
  }

  getWidgetStore(key: PresetIds): WidgetConfig {
    return this.widgetStores[key]
  }
}
