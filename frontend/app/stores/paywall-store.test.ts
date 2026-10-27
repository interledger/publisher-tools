import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDefaultPaywallProfile } from '@shared/default-data'
import { PROFILE_A, PROFILE_B, TOOL_PAYWALL } from '@shared/types'
import { saveToolProfile } from '~/utils/profile-api'
import { actions, paywall } from './paywall-store'
import { toolActions } from './toolStore'

vi.mock('~/utils/profile-api', () => ({
  getToolProfiles: vi.fn(),
  saveToolProfile: vi.fn(async () => ({ success: true })),
}))

describe('paywall store', () => {
  afterEach(() => {
    toolActions.setActiveTab(PROFILE_A)
    vi.unstubAllGlobals()
  })

  it('reports its own profile as the active one, whichever tab is selected', () => {
    toolActions.setActiveTab(PROFILE_B)
    toolActions.setCurrentToolType(TOOL_PAYWALL)

    expect(paywall.profileId).toBe(PROFILE_A)
    expect(toolActions.getActiveProfileId()).toBe(PROFILE_A)
  })

  it('edits and saves its own profile, not the version selected in other tools', async () => {
    // saving a profile also stores its snapshot
    vi.stubGlobal('localStorage', { setItem: vi.fn() })
    // e.g. "Version 2" selected in the banner
    toolActions.setActiveTab(PROFILE_B)

    paywall.profile.title.text = 'Paywall title'

    expect(paywall.profiles[PROFILE_A].title.text).toBe('Paywall title')
    expect(paywall.profiles[PROFILE_B].title.text).not.toBe('Paywall title')

    await actions.saveProfile()
    expect(saveToolProfile).toHaveBeenCalledWith(
      expect.any(String),
      TOOL_PAYWALL,
      expect.objectContaining({
        title: expect.objectContaining({ text: 'Paywall title' }),
      }),
      PROFILE_A,
    )

    actions.commitProfile()
    expect(actions.hasSectionChanges()).toBe(false)
    expect(paywall.profilesUpdate.has(PROFILE_B)).toBe(false)
  })

  it('restores defaults only for the given section', () => {
    const defaults = createDefaultPaywallProfile('Default')
    paywall.profile.$name = 'My paywall'
    paywall.profile.title.text = 'Custom title'
    paywall.profile.colors.background = '#000000'

    actions.restoreDefaultSection('content')

    expect(paywall.profile.title.text).toBe(defaults.title.text)
    expect(paywall.profile.colors.background).toBe('#000000')
    expect(paywall.profile.$name).toBe('My paywall')

    actions.restoreDefaultSection('appearance')

    expect(paywall.profile.colors.background).toBe(defaults.colors.background)
    expect(paywall.profile.$name).toBe('My paywall')
  })

  it('keeps price and placement when restoring the appearance', () => {
    paywall.profile.price.value = '5.00'
    paywall.profile.price.currency = 'EUR'
    paywall.profile.behavior.delay.value = 10
    paywall.profile.behavior.coverage.value = 75

    actions.restoreDefaultSection('appearance')

    expect(paywall.profile.price).toEqual({ value: '5.00', currency: 'EUR' })
    expect(paywall.profile.behavior.delay.value).toBe(10)
    expect(paywall.profile.behavior.coverage.value).toBe(75)
    expect(actions.hasDefaultChanges('appearance')).toBe(false)
  })
})
