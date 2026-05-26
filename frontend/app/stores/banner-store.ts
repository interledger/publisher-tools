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
import { createWalletStore } from '~/stores/wallet-store'
import { getToolProfiles, saveToolProfile } from '~/utils/profile-api'
import { patchProxy, splitProfileProperties } from '~/utils/utils.storage'
import { createToolStoreUtils } from '~/utils/utils.store'
import { toolState } from './toolStore'

export const {
  wallet: bannerWallet,
  load: loadBannerWallet,
  persist: persistBannerWallet,
  actions: bannerWalletActions,
} = createWalletStore(TOOL_BANNER)

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
    return await getToolProfiles(bannerWallet.walletAddress, tool)
  },
  resetProfiles() {
    bannerStoreUtils.removeProfilesFromStorage()

    PROFILE_IDS.forEach((id) => {
      const profile = createDefaultBannerProfile(DEFAULT_PROFILE_NAMES[id])
      snapshots.set(id, profile)
      patchProxy(banner.profiles[id], profile)
    })
  },
  resetProfileSection(section: 'content' | 'appearance') {
    const snapshot = snapshots.get(toolState.activeTab)
    if (!snapshot) {
      throw new Error('No snapshot found for the profile')
    }

    const { content, appearance } = splitProfileProperties(snapshot)
    patchProxy(banner.profile, section === 'content' ? content : appearance)
  },
  async saveProfile(): Promise<SaveResult> {
    const profile = snapshot(banner.profile)
    return await saveToolProfile(
      bannerWallet.walletAddress,
      TOOL_BANNER,
      profile,
      toolState.activeTab,
    )
  },
  commitProfile() {
    bannerStoreUtils.commitActiveProfile(toolState.activeTab)
  },
  commitProfiles() {
    bannerStoreUtils.commitAllProfiles()
  },
}

export const {
  subscribeProfilesToStorage,
  hydrateProfilesFromStorage,
  captureSnapshotsToStorage,
  hydrateSnapshotsFromStorage,
  subscribeProfilesToUpdates,
} = bannerStoreUtils
