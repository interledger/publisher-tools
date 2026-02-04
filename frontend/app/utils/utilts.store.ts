import { deepEqual } from 'fast-equals'
import { snapshot, subscribe } from 'valtio'
import { createDefaultBannerProfile } from '@shared/default-data'
import {
  type ProfileId,
  type Tool,
  type ToolProfile,
  type ToolProfiles,
  DEFAULT_PROFILE_NAMES,
  PROFILE_IDS,
  TOOL_BANNER,
} from '@shared/types'
import type { BannerStore } from '~/stores/banner-store'

type Store = BannerStore
const STORAGE_PREFIX = 'wmt'

export function getStorageKeys(tool: Tool) {
  return {
    snapshotsStorageKey: `${STORAGE_PREFIX}-${tool}-snapshots`,
    getProfileStorageKey: (profileId: ProfileId) =>
      `${STORAGE_PREFIX}-${tool}-${profileId}`,
  }
}

function getCreateDefaultProfile<T extends Tool>(tool: T) {
  switch (tool) {
    case TOOL_BANNER:
      return createDefaultBannerProfile
    default:
      throw new Error(`Unknown tool: ${tool}`)
  }
}

interface ToolStoreConfig<T extends Tool> {
  tool: T
  store: Store
  snapshots: Map<ProfileId, ToolProfile<T>>
}

export function createToolStoreUtils<T extends Tool>(
  config: ToolStoreConfig<T>,
) {
  const { tool, store, snapshots } = config
  const { snapshotsStorageKey, getProfileStorageKey } = getStorageKeys(tool)
  const createDefaultProfile = getCreateDefaultProfile(tool)

  function parseProfileFromStorage(
    profileId: ProfileId,
  ): ToolProfile<T> | null {
    const storageKey = getProfileStorageKey(profileId)
    const storage = localStorage.getItem(storageKey)
    if (!storage) return null

    try {
      const profile: ToolProfile<T> = JSON.parse(storage)
      const isValid =
        typeof profile === 'object' &&
        Object.keys(profile).every((key) => key in store.profile)

      if (!isValid) throw new Error('Invalid profile shape')
      return profile
    } catch (error) {
      console.warn(
        `Failed to load profile ${profileId} from localStorage:`,
        error,
      )
      localStorage.removeItem(storageKey)
      return null
    }
  }

  function subscribeProfileToStorage(profileId: ProfileId) {
    const profile = store.profiles[profileId]
    subscribe(profile, () => {
      const snap = snapshot(profile)
      localStorage.setItem(
        getProfileStorageKey(profileId),
        JSON.stringify(snap),
      )
    })
  }

  function checkForPendingUpdates(
    id: ProfileId,
    snap: ToolProfile<T>,
  ): boolean {
    const baseline = snapshots.get(id)
    if (!baseline) {
      return false
    }

    return !deepEqual(snap, baseline)
  }

  function subscribeProfileToUpdates(id: ProfileId) {
    const profile = store.profiles[id]
    subscribe(profile, () => {
      const snap = snapshot(profile) as ToolProfile<T>
      if (checkForPendingUpdates(id, snap)) {
        store.profilesUpdate.add(id)
      } else {
        store.profilesUpdate.delete(id)
      }
    })
  }

  return {
    subscribeProfilesToStorage() {
      PROFILE_IDS.forEach(subscribeProfileToStorage)
    },

    hydrateProfilesFromStorage() {
      PROFILE_IDS.forEach((profileId) => {
        const parsed = parseProfileFromStorage(profileId)
        if (parsed) {
          Object.assign(store.profiles[profileId], parsed)
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
      const storage = localStorage.getItem(snapshotsStorageKey)
      if (!storage) return

      try {
        const stored: ToolProfiles<T> = JSON.parse(storage)
        if (!stored) return

        const isValid = (profile: ToolProfile<T>) =>
          typeof profile === 'object' &&
          Object.keys(profile).every((key) => key in store.profile)

        Object.entries(stored).forEach(([id, profile]) => {
          if (isValid(profile as ToolProfile<T>)) {
            snapshots.set(id as ProfileId, profile as ToolProfile<T>)
          }
        })
      } catch (error) {
        console.warn(`Failed to hydrate ${tool} baselines:`, error)
        localStorage.removeItem(snapshotsStorageKey)
      }
    },

    subscribeProfilesToUpdates() {
      PROFILE_IDS.forEach(subscribeProfileToUpdates)
    },

    resetSnapshots() {
      PROFILE_IDS.forEach((id) => {
        const profile = createDefaultProfile(DEFAULT_PROFILE_NAMES[id])
        snapshots.set(id, profile as ToolProfile<T>)
      })
    },
  }
}
