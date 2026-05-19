import { describe, it, expect } from 'vitest'
import { diffProfile } from './profile-diff'

describe('diffProfile', () => {
  it('returns empty when nothing changed', () => {
    const profile = { title: { text: 'hello' }, color: { text: '#fff' } }
    expect(diffProfile(profile, profile)).toEqual({})
  })

  it('emits new string value for primitive string changes', () => {
    const prev = { title: { text: 'hi' } }
    const curr = { title: { text: 'hello world' } }
    expect(diffProfile(prev, curr)).toEqual({
      'field.title.text': 'hello world',
    })
  })

  it('emits true for non-string primitive changes', () => {
    const prev = { description: { isVisible: false } }
    const curr = { description: { isVisible: true } }
    expect(diffProfile(prev, curr)).toEqual({
      'field.description.isVisible': true,
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
    expect(diffProfile(prev, curr)).toEqual({ 'field.$name': 'Production' })
  })

  it('emits all current fields when prev is undefined', () => {
    const curr = { title: { text: 'hi' }, description: { isVisible: true } }
    expect(diffProfile(undefined, curr)).toEqual({
      'field.title.text': 'hi',
      'field.description.isVisible': true,
    })
  })

  it('emits empty string for cleared string fields', () => {
    const prev = { title: { text: 'hello' } }
    const curr = { title: { text: '' } }
    expect(diffProfile(prev, curr)).toEqual({ 'field.title.text': '' })
  })
})
