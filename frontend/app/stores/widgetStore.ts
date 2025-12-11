import { proxy } from 'valtio'
import { proxySet } from 'valtio/utils'
import { createDefaultWidgetProfile } from '@shared/default-data'
import { PROFILE_IDS, type ProfileId, type WidgetProfile } from '@shared/types'
import type { StableKey } from './toolStore'

export type WidgetStore = ReturnType<typeof createWidgetStore>

export const createDataStoreWidget = (profileName: string) =>
  proxy(createDefaultWidgetProfile(profileName))

export function createWidgetStore() {
  return proxy({
    profiles: {
      version1: createDataStoreWidget('Default profile 1'),
      version2: createDataStoreWidget('Default profile 2'),
      version3: createDataStoreWidget('Default profile 3')
    } as Record<ProfileId, WidgetProfile>,
    activeTab: 'version1' as ProfileId,
    dirtyProfiles: proxySet<StableKey>(),
    getStore(key: ProfileId): WidgetProfile {
      return this.profiles[key]
    },
    getProfileTabs() {
      return PROFILE_IDS.map((id) => ({
        id,
        label: this.profiles[id].$name,
        isDirty: this.dirtyProfiles.has(id)
      }))
    },
    setActiveTab(key: ProfileId) {
      this.activeTab = key
    },
    setProfileName(name: string) {
      this.profiles[this.activeTab].$name = name
    }
  })
}
