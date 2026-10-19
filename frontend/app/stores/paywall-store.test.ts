import { describe, expect, it } from 'vitest'
import { createDefaultPaywallProfile } from '@shared/default-data'
import { actions, paywall } from './paywall-store'

describe('paywall store', () => {
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
