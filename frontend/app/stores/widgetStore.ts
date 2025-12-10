import { proxy } from 'valtio'
import { createDefaultWidgetProfile } from '@shared/default-data'
import type { ProfileId, WidgetProfile } from '@shared/types'

export const createDataStoreWidget = (profileName: string) =>
  proxy(createDefaultWidgetProfile(profileName))

export class WidgetStore {
  private stores: Record<ProfileId, WidgetProfile> = {
    version1: createDataStoreWidget('Default profile 1'),
    version2: createDataStoreWidget('Default profile 2'),
    version3: createDataStoreWidget('Default profile 3')
  }

  activeTab: ProfileId = 'version1'

  getStore(key: ProfileId): WidgetProfile {
    return this.stores[key]
  }
}
