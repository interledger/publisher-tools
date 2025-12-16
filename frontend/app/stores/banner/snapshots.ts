import { deepEqual } from 'fast-equals'
import { snapshot, subscribe } from 'valtio'
import { subscribeKey } from 'valtio/utils'
import { createDefaultBannerProfile } from '@shared/default-data'
import { PROFILE_IDS, DEFAULT_PROFILE_NAMES } from '@shared/types'
import type { ProfileId, BannerProfile, Configuration } from '@shared/types'
import { banner } from './store'
import { toolState } from '../toolStore'

const SNAP_STORAGE_KEY = 'wmt-banner-snapshots'

const snapshots = new Map<ProfileId, BannerProfile>(
  PROFILE_IDS.map((id) => [
    id,
    createDefaultBannerProfile(DEFAULT_PROFILE_NAMES[id])
  ])
)

export function subscribeSnapshotsToStorage() {
  subscribeKey(toolState, `isWalletConnected`, () => {
    const snap = snapshot(banner).profiles

    Object.entries(snap).forEach(([profileId, profile]) => {
      snapshots.set(profileId as ProfileId, profile)
    })

    localStorage.setItem(SNAP_STORAGE_KEY, JSON.stringify(snap))
  })
}

export function hydrateSnapshotsFromStorage() {
  const storage = localStorage.getItem(SNAP_STORAGE_KEY)
  if (!storage) return

  try {
    const stored: Configuration<'banner'> = JSON.parse(storage)

    const isValid = (profile: BannerProfile) =>
      typeof profile === 'object' &&
      Object.keys(profile).every((key) => key in banner.profile)

    Object.entries(stored).forEach(([id, profile]) => {
      if (isValid(profile)) {
        snapshots.set(id as ProfileId, profile)
      }
    })
  } catch (error) {
    console.warn('Failed to hydrate banner baselines:', error)
    localStorage.removeItem(SNAP_STORAGE_KEY)
  }
}

export function subscribeProfilesToUpdates() {
  PROFILE_IDS.forEach((profileId) => {
    subscribeProfileToUpdates(profileId)
  })
}

function subscribeProfileToUpdates(id: ProfileId) {
  const profile = banner.profiles[id]
  subscribe(profile, () => {
    const snap = snapshot(profile)
    if (checkForPendingUpdates(id, snap)) {
      banner.profilesUpdate.add(id)
    } else {
      banner.profilesUpdate.delete(id)
    }
  })
}

function checkForPendingUpdates(id: ProfileId, snap: BannerProfile): boolean {
  const baseline = snapshots.get(id)
  if (!baseline) {
    return false
  }

  return !deepEqual(snap, baseline)
}
