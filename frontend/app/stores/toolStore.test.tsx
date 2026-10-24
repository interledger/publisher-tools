import { snapshot } from 'valtio'
import { describe, expect, it } from 'vitest'
import {
  PROFILE_A,
  PROFILE_B,
  type BannerProfile,
  type ProfileId,
} from '@shared/types'
import { banner } from '~/stores/banner-store'
import { toolActions } from '~/stores/toolStore'

const cloneBannerProfiles = () =>
  structuredClone(snapshot(banner.profiles)) as Record<ProfileId, BannerProfile>

describe('setToolProfiles', () => {
  it('marks profiles loaded from the server as saved', () => {
    toolActions.setCurrentToolType('banner')
    const profiles = cloneBannerProfiles()
    profiles[PROFILE_A].$name = 'From the server'

    toolActions.setToolProfiles(profiles)

    expect(banner.profilesUpdate.has(PROFILE_A)).toBe(false)
    expect(banner.profilesUpdate.has(PROFILE_B)).toBe(false)
  })

  it('keeps local changes that the server does not have as unsaved', () => {
    toolActions.setCurrentToolType('banner')
    const serverProfiles = cloneBannerProfiles()
    const localProfiles = cloneBannerProfiles()
    localProfiles[PROFILE_A].$name = 'Kept local change'

    toolActions.setToolProfiles(localProfiles, serverProfiles)

    expect(banner.profiles[PROFILE_A].$name).toBe('Kept local change')
    expect(banner.profilesUpdate.has(PROFILE_A)).toBe(true)
    expect(banner.profilesUpdate.has(PROFILE_B)).toBe(false)
  })
})
