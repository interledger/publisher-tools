import { proxy, snapshot, useSnapshot } from 'valtio'
import { proxySet } from 'valtio/utils'
import { createDefaultPaywallProfile } from '@shared/default-data'
import {
  type ProfileId,
  type PaywallProfile,
  type ToolProfiles,
  PROFILE_IDS,
  DEFAULT_PROFILE_NAMES,
  TOOL_PAYWALL,
} from '@shared/types'
import type { SaveResult } from '~/lib/types'
import { createWalletStore } from '~/stores/wallet-store'
import { getToolProfiles, saveToolProfile } from '~/utils/profile-api'
import { patchProxy, splitProfileProperties } from '~/utils/utils.storage'
import { createToolStoreUtils } from '~/utils/utils.store'
import { toolState } from './toolStore'

export const {
  wallet: paywallWallet,
  load: loadPaywallWallet,
  persist: persistPaywallWallet,
  actions: paywallWalletActions,
} = createWalletStore(TOOL_PAYWALL)

export type PaywallStore = ReturnType<typeof createPaywallStore>

const createProfileStorePaywall = (profileName: string) =>
  proxy(createDefaultPaywallProfile(profileName))

function createPaywallStore() {
  return proxy({
    profiles: Object.fromEntries(
      PROFILE_IDS.map((id) => [
        id,
        createProfileStorePaywall(DEFAULT_PROFILE_NAMES[id]),
      ]),
    ) as Record<ProfileId, PaywallProfile>,
    profilesUpdate: proxySet<ProfileId>(),

    get profile(): PaywallProfile {
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

export function usePaywallProfile(options?: {
  sync: boolean
}): [PaywallProfile, PaywallProfile] {
  const snapshot = useSnapshot(paywall.profile, options)
  return [snapshot, paywall.profile]
}

export const paywall = createPaywallStore()

const snapshots = new Map<ProfileId, PaywallProfile>(
  PROFILE_IDS.map((id) => [
    id,
    createDefaultPaywallProfile(DEFAULT_PROFILE_NAMES[id]),
  ]),
)

const paywallStoreUtils = createToolStoreUtils({
  tool: TOOL_PAYWALL,
  store: paywall,
  snapshots,
})

export const actions = {
  setProfileName(name: string) {
    paywall.profiles[toolState.activeTab].$name = name
  },
  setProfiles(profiles: ToolProfiles<'paywall'>) {
    if (!profiles) return
    Object.entries(profiles).forEach(([profileId, profile]) => {
      Object.assign(paywall.profiles[profileId as ProfileId], profile)
    })
  },
  async getProfiles(
    tool: typeof TOOL_PAYWALL,
  ): Promise<ToolProfiles<'paywall'>> {
    return await getToolProfiles(paywallWallet.walletAddress, tool)
  },
  resetProfiles() {
    paywallStoreUtils.removeProfilesFromStorage()

    PROFILE_IDS.forEach((id) => {
      const profile = createDefaultPaywallProfile(DEFAULT_PROFILE_NAMES[id])
      snapshots.set(id, profile)
      patchProxy(paywall.profiles[id], profile)
    })
  },
  resetProfileSection(section: 'content' | 'appearance') {
    const snapshot = snapshots.get(toolState.activeTab)
    if (!snapshot) {
      throw new Error('No snapshot found for the profile')
    }

    const { content, appearance } = splitProfileProperties(snapshot)
    patchProxy(paywall.profile, section === 'content' ? content : appearance)
  },
  async saveProfile(): Promise<SaveResult> {
    const profile = snapshot(paywall.profile)
    return await saveToolProfile(
      paywallWallet.walletAddress,
      TOOL_PAYWALL,
      profile,
      toolState.activeTab,
    )
  },
  commitProfile() {
    return paywallStoreUtils.commitActiveProfile(toolState.activeTab)
  },
  commitProfiles() {
    paywallStoreUtils.commitAllProfiles()
  },
}

export const {
  subscribeProfilesToStorage,
  hydrateProfilesFromStorage,
  captureSnapshotsToStorage,
  hydrateSnapshotsFromStorage,
  subscribeProfilesToUpdates,
} = paywallStoreUtils
