import { deepEqual } from 'fast-equals'
import { snapshot, subscribe } from 'valtio'
import {
  type BaseToolProfile,
  type ProfileId,
  type Tool,
  type ToolProfile,
  type ToolProfiles,
  PROFILE_IDS,
} from '@shared/types'
import type { BannerStore } from '~/stores/banner-store'
import type { OfferwallStore } from '~/stores/offerwall-store'
import type { PaywallStore } from '~/stores/paywall-store'
import type { WidgetStore } from '~/stores/widget-store'
import { diffProfile, type ChangedFields } from '~/utils/profile-diff'
import {
  omit,
  parseWithShape,
  patchProxy,
  subscribeToStorage,
} from '~/utils/utils.storage'

type Store = BannerStore | WidgetStore | OfferwallStore | PaywallStore
const STORAGE_PREFIX = 'wmt'

export function getStorageKeys(tool: Tool) {
  return {
    snapshotsStorageKey: `${STORAGE_PREFIX}-${tool}-snapshots`,
    getProfileStorageKey: (profileId: ProfileId) =>
      `${STORAGE_PREFIX}-${tool}-${profileId}`,
  }
}

interface ToolStoreConfig<T extends Tool> {
  tool: T
  store: Store
  snapshots: Map<ProfileId, ToolProfile<T>>
}

export function parseSnapshots<T extends Tool>(
  raw: string | null,
): ToolProfiles<T> | null {
  if (!raw) return null
  try {
    const parsed: ToolProfiles<T> = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

export function createToolStoreUtils<T extends Tool>(
  config: ToolStoreConfig<T>,
) {
  const { tool, store, snapshots } = config
  const { snapshotsStorageKey, getProfileStorageKey } = getStorageKeys(tool)

  function loadProfileFromStorage(profileId: ProfileId): ToolProfile<T> | null {
    const storageKey = getProfileStorageKey(profileId)
    const raw = localStorage.getItem(storageKey)
    const parsed = parseWithShape(
      raw,
      store.profile as ToolProfile<T>,
    ) as ToolProfile<T> | null
    if (parsed === null && raw !== null) {
      console.warn(`Failed to load profile ${profileId} from localStorage`)
      localStorage.removeItem(storageKey)
    }
    return parsed
  }

  function subscribeProfileToStorage(profileId: ProfileId) {
    const profile = store.profiles[profileId]
    return subscribe(profile, () => {
      const snap = snapshot(profile)
      localStorage.setItem(
        getProfileStorageKey(profileId),
        JSON.stringify(snap),
      )
    })
  }

  function hasPendingUpdates(id: ProfileId, snap: ToolProfile<T>): boolean {
    const baseline = snapshots.get(id)
    if (!baseline) {
      return false
    }

    const keys: (keyof BaseToolProfile)[] = ['$version', '$modifiedAt']
    return !deepEqual(omit(snap, keys), omit(baseline, keys))
  }

  function recomputeProfileUpdate(id: ProfileId) {
    const snap = snapshot(store.profiles[id]) as ToolProfile<T>
    if (hasPendingUpdates(id, snap)) {
      store.profilesUpdate.add(id)
    } else {
      store.profilesUpdate.delete(id)
    }
  }

  function subscribeProfileToUpdates(id: ProfileId) {
    const profile = store.profiles[id]
    return subscribe(profile, () => recomputeProfileUpdate(id))
  }

  function persistSnapshots() {
    localStorage.setItem(
      snapshotsStorageKey,
      JSON.stringify(Object.fromEntries(snapshots)),
    )
  }

  function applySnapshotsFromStorage(raw: string | null) {
    const stored = parseSnapshots<T>(raw)
    if (!stored) return false

    let hasEntries = false
    Object.entries(stored).forEach(([id, profile]) => {
      snapshots.set(id as ProfileId, profile as ToolProfile<T>)
      hasEntries = true
    })
    return hasEntries
  }

  return {
    subscribeProfilesToStorage() {
      const unsubscribes = PROFILE_IDS.map(subscribeProfileToStorage)
      return () => unsubscribes.forEach((s) => s())
    },

    hydrateProfilesFromStorage() {
      PROFILE_IDS.forEach((profileId) => {
        const profile = loadProfileFromStorage(profileId)
        if (profile) {
          patchProxy(store.profiles[profileId], profile)
        }
      })
    },

    captureSnapshotsToStorage() {
      const snap = snapshot(store.profiles)
      Object.entries(snap).forEach(([profileId, profile]) => {
        snapshots.set(profileId as ProfileId, profile as ToolProfile<T>)
      })
      localStorage.setItem(snapshotsStorageKey, JSON.stringify(snap))
    },

    hydrateSnapshotsFromStorage() {
      const raw = localStorage.getItem(snapshotsStorageKey)
      const applied = applySnapshotsFromStorage(raw)
      if (!applied && raw !== null) {
        console.warn(`Failed to hydrate ${tool} baselines`)
        localStorage.removeItem(snapshotsStorageKey)
      }
    },

    subscribeProfilesToUpdates() {
      const unsubscribes = PROFILE_IDS.map(subscribeProfileToUpdates)
      return () => unsubscribes.forEach((s) => s())
    },

    subscribeProfilesToCrossTab() {
      const profileKeyToId = new Map(
        PROFILE_IDS.map((id) => [getProfileStorageKey(id), id]),
      )

      return subscribeToStorage((event) => {
        const profileId = event.key ? profileKeyToId.get(event.key) : undefined
        if (profileId) {
          const parsed = parseWithShape(
            event.newValue,
            store.profile as ToolProfile<T>,
          ) as ToolProfile<T> | null
          if (parsed) patchProxy(store.profiles[profileId], parsed)
          return
        }

        if (event.key === snapshotsStorageKey) {
          const applied = applySnapshotsFromStorage(event.newValue)
          if (applied) PROFILE_IDS.forEach(recomputeProfileUpdate)
        }
      })
    },

    // User-initiated save; returns diff for analytics
    commitActiveProfile(activeTab: ProfileId): ChangedFields {
      const prev = snapshots.get(activeTab)!
      const current = snapshot(store.profiles[activeTab]) as ToolProfile<T>
      const changed = diffProfile(prev, current)

      snapshots.set(activeTab, current)
      store.profilesUpdate.delete(activeTab)
      // TODO: determine if this needed here
      persistSnapshots()

      return changed
    },

    // Server-load baseline reset; no analytics
    commitAllProfiles(): void {
      PROFILE_IDS.forEach((id) => {
        const profile = snapshot(store.profiles[id]) as ToolProfile<T>
        snapshots.set(id, profile)
        store.profilesUpdate.delete(id)
      })
      persistSnapshots()
    },

    removeProfilesFromStorage() {
      localStorage.removeItem(snapshotsStorageKey)

      PROFILE_IDS.forEach((id) => {
        const storageKey = getProfileStorageKey(id)
        localStorage.removeItem(storageKey)
      })
    },
  }
}
