import { proxy, snapshot, useSnapshot } from 'valtio'
import { proxySet } from 'valtio/utils'
import { createDefaultBannerProfile } from '@shared/default-data'
import {
  type ProfileId,
  type BannerProfile,
  type ToolProfiles,
  PROFILE_IDS,
  DEFAULT_PROFILE_NAMES,
  TOOL_BANNER,
} from '@shared/types'
import type { SaveResult } from '~/lib/types'
import { getToolProfiles, saveToolProfile } from '~/utils/profile-api'
import { createToolStoreUtils, getStorageKeys } from '~/utils/utilts.store'
import { toolState } from './toolStore'

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

function patchProxy<T extends object>(target: T, source: DeepPartial<T>): void {
  for (const key in source) {
    const value = source[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      patchProxy(target[key] as object, value as object)
    } else {
      target[key] = value as T[Extract<keyof T, string>]
    }
  }
}

export type BannerStore = ReturnType<typeof createBannerStore>

const createProfileStoreBanner = (profileName: string) =>
  proxy(createDefaultBannerProfile(profileName))

function createBannerStore() {
  return proxy({
    profiles: Object.fromEntries(
      PROFILE_IDS.map((id) => [
        id,
        createProfileStoreBanner(DEFAULT_PROFILE_NAMES[id]),
      ]),
    ) as Record<ProfileId, BannerProfile>,
    profilesUpdate: proxySet<ProfileId>(),

    get profile(): BannerProfile {
      return this.profiles[toolState.activeTab]
    },
    get profileTabs() {
      return PROFILE_IDS.map((id) => ({
        id,
        label: this.profiles[id].$name,
        hasUpdates: this.profilesUpdate.has(id),
      }))
    },
  })
}

export function useBannerProfile(options?: {
  sync: boolean
}): [BannerProfile, BannerProfile] {
  // https://github.com/pmndrs/valtio/issues/132
  const snapshot = useSnapshot(banner.profile, options)
  return [snapshot, banner.profile]
}

export const banner = createBannerStore()

const snapshots = new Map<ProfileId, BannerProfile>(
  PROFILE_IDS.map((id) => [
    id,
    createDefaultBannerProfile(DEFAULT_PROFILE_NAMES[id]),
  ]),
)

const bannerStoreUtils = createToolStoreUtils({
  tool: TOOL_BANNER,
  store: banner,
  snapshots,
})

const { snapshotsStorageKey } = getStorageKeys(TOOL_BANNER)

export const actions = {
  setProfileName(name: string) {
    banner.profiles[toolState.activeTab].$name = name
  },
  setProfiles(profiles: ToolProfiles<'banner'>) {
    if (!profiles) return
    Object.entries(profiles).forEach(([profileId, profile]) => {
      Object.assign(banner.profiles[profileId as ProfileId], profile)
    })
  },
  async getProfiles(tool: typeof TOOL_BANNER): Promise<ToolProfiles<'banner'>> {
    const { walletAddress } = toolState
    return await getToolProfiles(walletAddress, tool)
  },
  resetProfiles() {
    PROFILE_IDS.forEach((id) => {
      const profile = createDefaultBannerProfile(DEFAULT_PROFILE_NAMES[id])
      snapshots.set(id, profile)
      Object.assign(banner.profiles[id], profile)
    })
  },
  resetProfileSection(section: 'content' | 'appearance') {
    const snap = snapshots.get(toolState.activeTab)
    if (!snap) {
      throw new Error('No snapshot found for the profile')
    }

    if (section === 'content') {
      const { title, description } = snap
      patchProxy(banner.profile, { title, description })
    } else {
      const { font, animation, position, border, color, thumbnail } = snap
      patchProxy(banner.profile, {
        font,
        animation,
        position,
        border,
        color,
        thumbnail,
      })
    }
  },
  async saveProfile(): Promise<SaveResult> {
    const profile = snapshot(banner.profile)
    const { walletAddress, activeTab } = toolState
    return await saveToolProfile(walletAddress, TOOL_BANNER, profile, activeTab)
  },
  commitProfile() {
    const profile = snapshot(banner.profile)
    snapshots.set(toolState.activeTab, profile)
    banner.profilesUpdate.delete(toolState.activeTab)

    const snaps = Object.fromEntries(snapshots.entries())
    localStorage.setItem(snapshotsStorageKey, JSON.stringify(snaps))
  },
  commitProfiles() {
    PROFILE_IDS.forEach((id) => {
      const profile = snapshot(banner.profiles[id])
      snapshots.set(id, profile)
      banner.profilesUpdate.delete(id)
    })

    const snaps = Object.fromEntries(snapshots.entries())
    localStorage.setItem(snapshotsStorageKey, JSON.stringify(snaps))
  },
}

export const {
  subscribeProfilesToStorage,
  hydrateProfilesFromStorage,
  captureSnapshotsToStorage,
  hydrateSnapshotsFromStorage,
  subscribeProfilesToUpdates,
} = bannerStoreUtils
