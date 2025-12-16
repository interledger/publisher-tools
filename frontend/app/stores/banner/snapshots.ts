import isEqual from 'lodash/isEqual'
import { snapshot } from 'valtio'
import { createDefaultBannerProfile } from '@shared/default-data'
import { PROFILE_IDS, DEFAULT_PROFILE_NAME } from '@shared/types'
import type { ProfileId, BannerProfile, Configuration } from '@shared/types'
import { banner } from './store'

const SNAP_STORAGE_KEY = 'wmt-banner-snapshots'

const snapshots = new Map<ProfileId, BannerProfile>(
  PROFILE_IDS.map((id, idx) => [
    id,
    createDefaultBannerProfile(DEFAULT_PROFILE_NAME[idx])
  ])
)

export function setSnapshots(config: Configuration<'banner'>) {
  Object.entries(config).forEach(([profileId, profile]) => {
    snapshots.set(profileId as ProfileId, profile)
  })

  localStorage.setItem(SNAP_STORAGE_KEY, JSON.stringify(config))
}

export function isProfileDirty(id: ProfileId) {
  const profile = snapshots.get(id)
  if (!profile) {
    return false
  }

  const snap = snapshot(banner.profiles[id])
  return !isEqual(snap, profile)
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
      if (profile && isValid(profile)) {
        snapshots.set(id as ProfileId, profile)
      }
    })
  } catch (error) {
    console.warn('Failed to hydrate banner baselines:', error)
    localStorage.removeItem(SNAP_STORAGE_KEY)
  }
}
