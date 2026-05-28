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

  it('emits length bucket for primitive string changes', () => {
    const prev = { title: { text: 'hi' } }
    const curr = { title: { text: 'hello world' } }
    expect(diffProfile(prev, curr)).toEqual({
      'f.title.text': '11-30',
    })
  })

  it('emits true for non-string primitive changes', () => {
    const prev = { description: { isVisible: false } }
    const curr = { description: { isVisible: true } }
    expect(diffProfile(prev, curr)).toEqual({
      'f.description.isVisible': true,
    })
  })

  it('skips $version and $modifiedAt', () => {
    const prev = { $version: '1', $modifiedAt: 'a', title: { text: 'hi' } }
    const curr = { $version: '2', $modifiedAt: 'b', title: { text: 'hi' } }
    expect(diffProfile(prev, curr)).toEqual({})
  })

  it('includes $name renames', () => {
    const prev = { $name: 'Default' }
    const curr = { $name: 'Production' }
    expect(diffProfile(prev, curr)).toEqual({ 'f.$name': '1-10' })
  })

  it('emits "0" bucket for cleared string fields', () => {
    const prev = { title: { text: 'hello' } }
    const curr = { title: { text: '' } }
    expect(diffProfile(prev, curr)).toEqual({ 'f.title.text': '0' })
  })

  it.each([
    ['', '0'],
    ['a', '1-10'],
    ['x'.repeat(10), '1-10'],
    ['x'.repeat(11), '11-30'],
    ['x'.repeat(30), '11-30'],
    ['x'.repeat(31), '31-60'],
    ['x'.repeat(60), '31-60'],
    ['x'.repeat(61), '61-150'],
    ['x'.repeat(150), '61-150'],
    ['x'.repeat(151), '151+'],
    ['x'.repeat(500), '151+'],
  ])('buckets string of length %i as %s', (value, bucket) => {
    const prev = { title: { text: 'seed' } }
    const curr = { title: { text: value } }
    expect(diffProfile(prev, curr)).toEqual({ 'f.title.text': bucket })
  })
})
