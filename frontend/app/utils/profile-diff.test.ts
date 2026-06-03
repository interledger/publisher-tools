import { describe, it, expect } from 'vitest'
import { diffProfile } from './profile-diff'

describe('diffProfile', () => {
  it('returns empty when nothing changed', () => {
    const profile = { title: { text: 'hello' }, color: { text: '#fff' } }
    expect(diffProfile(profile, profile)).toEqual({})
  })

  it('returns empty for structurally equal profiles with different references', () => {
    const prev = { title: { text: 'hello' } }
    const curr = { title: { text: 'hello' } }
    expect(diffProfile(prev, curr)).toEqual({})
  })

  it('buckets title text by length', () => {
    const prev = { title: { text: 'hi' } }
    const curr = { title: { text: 'hello world' } }
    expect(diffProfile(prev, curr)).toEqual({
      'f.title.text': '11-20',
    })
  })

  it('emits suggested title presets as-is, not bucketed', () => {
    const prev = { title: { text: 'hi' } }
    const curr = { title: { text: 'Pay as you browse' } }
    expect(diffProfile(prev, curr)).toEqual({
      'f.title.text': 'Pay as you browse',
    })
  })

  it('buckets description text with coarser buckets', () => {
    const prev = { description: { text: 'hi' } }
    const curr = { description: { text: 'x'.repeat(75) } }
    expect(diffProfile(prev, curr)).toEqual({
      'f.description.text': '51-150',
    })
  })

  it('emits actual boolean value', () => {
    const prev = { description: { isVisible: false } }
    const curr = { description: { isVisible: true } }
    expect(diffProfile(prev, curr)).toEqual({
      'f.description.isVisible': true,
    })
  })

  it('emits actual enum string value (not bucketed)', () => {
    const prev = { animation: { type: 'None' } }
    const curr = { animation: { type: 'Slide' } }
    expect(diffProfile(prev, curr)).toEqual({
      'f.animation.type': 'Slide',
    })
  })

  it('emits hex color value as-is', () => {
    const prev = { color: { background: '#ffffff' } }
    const curr = { color: { background: '#000000' } }
    expect(diffProfile(prev, curr)).toEqual({
      'f.color.background': '#000000',
    })
  })

  it('emits color.text hex as-is (not bucketed)', () => {
    const prev = { color: { text: '#ffffff' } }
    const curr = { color: { text: '#000000' } }
    expect(diffProfile(prev, curr)).toEqual({
      'f.color.text': '#000000',
    })
  })

  it('emits colors.text hex as-is (offerwall plural shape)', () => {
    const prev = { colors: { text: '#676767' } }
    const curr = { colors: { text: '#123456' } }
    expect(diffProfile(prev, curr)).toEqual({
      'f.colors.text': '#123456',
    })
  })

  it('emits asset id value as-is', () => {
    const prev = { thumbnail: { value: 'default' } }
    const curr = { thumbnail: { value: 'wm-logo' } }
    expect(diffProfile(prev, curr)).toEqual({
      'f.thumbnail.value': 'wm-logo',
    })
  })

  it('emits (none) sentinel when a non-text value is cleared', () => {
    const prev = { thumbnail: { value: 'default' } }
    const curr = { thumbnail: { value: '' } }
    expect(diffProfile(prev, curr)).toEqual({
      'f.thumbnail.value': '(none)',
    })
  })

  it('emits numeric value as-is', () => {
    const prev = { behavior: { coverage: { value: 50 } } }
    const curr = { behavior: { coverage: { value: 100 } } }
    expect(diffProfile(prev, curr)).toEqual({
      'f.behavior.coverage.value': 100,
    })
  })

  it('emits paywall price value (numeric string) as-is', () => {
    const prev = { price: { value: '2.00', currency: 'USD' } }
    const curr = { price: { value: '5.00', currency: 'USD' } }
    expect(diffProfile(prev, curr)).toEqual({
      'f.price.value': '5.00',
    })
  })

  it('stringifies object value changes (e.g. gradient backgrounds)', () => {
    const prev = { color: { background: '#fff' } }
    const curr = { color: { background: { gradient: 'linear-gradient(...)' } } }
    expect(diffProfile(prev, curr)).toEqual({
      'f.color.background': JSON.stringify({
        gradient: 'linear-gradient(...)',
      }),
    })
  })

  it('skips $version and $modifiedAt', () => {
    const prev = { $version: '1', $modifiedAt: 'a', title: { text: 'hi' } }
    const curr = { $version: '2', $modifiedAt: 'b', title: { text: 'hi' } }
    expect(diffProfile(prev, curr)).toEqual({})
  })

  it('buckets $name renames (user-provided text)', () => {
    const prev = { $name: 'Default' }
    const curr = { $name: 'Production' }
    expect(diffProfile(prev, curr)).toEqual({ 'f.$name': '1-10' })
  })

  it('buckets cta button text', () => {
    const prev = { ctaPayButton: { text: 'Pay' } }
    const curr = { ctaPayButton: { text: 'Support me now' } }
    expect(diffProfile(prev, curr)).toEqual({
      'f.ctaPayButton.text': '11-30',
    })
  })

  it('emits "0" bucket for cleared title', () => {
    const prev = { title: { text: 'hello' } }
    const curr = { title: { text: '' } }
    expect(diffProfile(prev, curr)).toEqual({ 'f.title.text': '0' })
  })

  it.each([
    ['', '0'],
    ['a', '1-10'],
    ['x'.repeat(10), '1-10'],
    ['x'.repeat(11), '11-20'],
    ['x'.repeat(20), '11-20'],
    ['x'.repeat(21), '21-30'],
    ['x'.repeat(30), '21-30'],
    ['x'.repeat(31), '31-60'],
    ['x'.repeat(60), '31-60'],
    ['x'.repeat(61), '60+'],
  ])('buckets title of length %i as %s', (value, bucket) => {
    const prev = { title: { text: 'seed' } }
    const curr = { title: { text: value } }
    expect(diffProfile(prev, curr)).toEqual({ 'f.title.text': bucket })
  })

  it.each([
    ['', '0'],
    ['x'.repeat(1), '1-50'],
    ['x'.repeat(50), '1-50'],
    ['x'.repeat(51), '51-150'],
    ['x'.repeat(150), '51-150'],
    ['x'.repeat(151), '151-300'],
    ['x'.repeat(300), '151-300'],
    ['x'.repeat(301), '300+'],
  ])('buckets description of length %i as %s', (value, bucket) => {
    const prev = { description: { text: 'seed' } }
    const curr = { description: { text: value } }
    expect(diffProfile(prev, curr)).toEqual({ 'f.description.text': bucket })
  })
})
