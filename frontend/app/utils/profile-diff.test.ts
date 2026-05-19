import { describe, it, expect } from 'vitest'
import { diffProfile } from './profile-diff'

describe('diffProfile', () => {
  it('returns empty when nothing changed', () => {
    const profile = { title: { text: 'hello' }, color: { text: '#fff' } }
    expect(diffProfile(profile, profile)).toEqual({})
  })

  it('emits string length for primitive string changes', () => {
    const prev = { title: { text: 'hi' } }
    const curr = { title: { text: 'hello world' } }
    expect(diffProfile(prev, curr)).toEqual({ 'field.title.text': 11 })
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
    expect(diffProfile(prev, curr)).toEqual({ 'field.$name': 10 })
  })

  it('treats atomicPaths as opaque via deepEqual', () => {
    const prev = {
      color: { background: { gradient: 'linear-gradient(red, blue)' } },
    }
    const curr = {
      color: { background: { gradient: 'linear-gradient(red, green)' } },
    }
    const atomic = new Set(['color.background'])
    expect(diffProfile(prev, curr, atomic)).toEqual({
      'field.color.background': true,
    })
  })

  it('does not emit unchanged atomic paths', () => {
    const prev = {
      color: { background: { gradient: 'linear-gradient(red, blue)' } },
    }
    const curr = {
      color: { background: { gradient: 'linear-gradient(red, blue)' } },
    }
    expect(diffProfile(prev, curr, new Set(['color.background']))).toEqual({})
  })

  it('emits true (not length) for atomic string values', () => {
    const prev = { color: { background: '#fff' } }
    const curr = { color: { background: '#000' } }
    expect(diffProfile(prev, curr, new Set(['color.background']))).toEqual({
      'field.color.background': true,
    })
  })

  it('emits all current fields when prev is undefined', () => {
    const curr = { title: { text: 'hi' }, description: { isVisible: true } }
    expect(diffProfile(undefined, curr)).toEqual({
      'field.title.text': 2,
      'field.description.isVisible': true,
    })
  })

  it('emits 0 for cleared string fields', () => {
    const prev = { title: { text: 'hello' } }
    const curr = { title: { text: '' } }
    expect(diffProfile(prev, curr)).toEqual({ 'field.title.text': 0 })
  })
})
