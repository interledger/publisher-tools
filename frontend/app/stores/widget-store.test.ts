import { describe, expect, it } from 'vitest'
import { createDefaultWidgetProfile } from '@shared/default-data'
import { actions, widget } from './widget-store'

describe('widget store', () => {
  it('restores defaults only for the given section', () => {
    const defaults = createDefaultWidgetProfile('Default')
    widget.profile.$name = 'My widget'
    widget.profile.title.text = 'Custom title'
    widget.profile.color.background = '#000000'

    actions.restoreDefaultSection('content')

    expect(widget.profile.title.text).toBe(defaults.title.text)
    expect(widget.profile.color.background).toBe('#000000')
    expect(widget.profile.$name).toBe('My widget')

    actions.restoreDefaultSection('appearance')

    expect(widget.profile.color.background).toBe(defaults.color.background)
    expect(widget.profile.$name).toBe('My widget')
  })

  it('reports whether a section differs from the defaults', () => {
    actions.restoreDefaultSection('content')
    actions.restoreDefaultSection('appearance')
    expect(actions.hasDefaultChanges('appearance')).toBe(false)

    widget.profile.color.background = '#000000'

    expect(actions.hasDefaultChanges('content')).toBe(false)
    expect(actions.hasDefaultChanges('appearance')).toBe(true)
  })
})
