import { afterEach, describe, expect, it } from 'vitest'
import { createDefaultBannerProfile } from '@shared/default-data'
import { PROFILE_A, PROFILE_B, TOOL_BANNER } from '@shared/types'
import { actions, banner } from './banner-store'
import { toolActions } from './toolStore'

describe('banner store', () => {
  afterEach(() => {
    toolActions.setActiveTab(PROFILE_A)
  })

  it('reports the selected tab as the active profile', () => {
    toolActions.setActiveTab(PROFILE_B)
    toolActions.setCurrentToolType(TOOL_BANNER)

    expect(banner.profileId).toBe(PROFILE_B)
    expect(banner.profile).toBe(banner.profiles[PROFILE_B])
    expect(toolActions.getActiveProfileId()).toBe(PROFILE_B)
  })

  it('restores defaults only for the given section', () => {
    const defaults = createDefaultBannerProfile('Default')
    banner.profile.$name = 'My banner'
    banner.profile.title.text = 'Custom title'
    banner.profile.description.isVisible = !defaults.description.isVisible
    banner.profile.color.background = '#000000'

    actions.restoreDefaultSection('content')

    expect(banner.profile.title.text).toBe(defaults.title.text)
    expect(banner.profile.description.isVisible).toBe(
      defaults.description.isVisible,
    )
    expect(banner.profile.color.background).toBe('#000000')
    expect(banner.profile.$name).toBe('My banner')

    actions.restoreDefaultSection('appearance')

    expect(banner.profile.color.background).toBe(defaults.color.background)
    expect(banner.profile.$name).toBe('My banner')
  })

  it('reports whether a section differs from the defaults', () => {
    actions.restoreDefaultSection('content')
    actions.restoreDefaultSection('appearance')
    expect(actions.hasDefaultChanges('content')).toBe(false)
    expect(actions.hasDefaultChanges('appearance')).toBe(false)

    banner.profile.title.text = 'Custom title'

    expect(actions.hasDefaultChanges('content')).toBe(true)
    expect(actions.hasDefaultChanges('appearance')).toBe(false)
  })
})
