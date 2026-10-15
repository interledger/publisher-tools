import { describe, expect, it } from 'vitest'
import { createDefaultBannerProfile } from '@shared/default-data'
import { actions, banner } from './banner-store'

describe('banner store', () => {
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
})
