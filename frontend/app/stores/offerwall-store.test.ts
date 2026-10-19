import { describe, expect, it } from 'vitest'
import { createDefaultOfferwallProfile } from '@shared/default-data'
import { actions, offerwall } from './offerwall-store'

describe('offerwall store', () => {
  it('restores the defaults', () => {
    const defaults = createDefaultOfferwallProfile('Default')
    offerwall.profile.$name = 'My offerwall'
    offerwall.profile.color.background = '#000000'

    expect(actions.hasDefaultChanges()).toBe(true)

    actions.restoreDefaultSection()

    expect(offerwall.profile.color.background).toBe(defaults.color.background)
    expect(offerwall.profile.$name).toBe('My offerwall')
    expect(actions.hasDefaultChanges()).toBe(false)
  })
})
