import { describe, it, expect } from 'vitest'
import { parseSnapshots } from './utils.store'

describe('parseSnapshots', () => {
  it('returns null for null / empty input', () => {
    expect(parseSnapshots(null)).toBeNull()
    expect(parseSnapshots('')).toBeNull()
  })

  it('returns null for invalid JSON', () => {
    expect(parseSnapshots('{bad')).toBeNull()
  })

  it('returns null for non-object JSON', () => {
    expect(parseSnapshots('42')).toBeNull()
    expect(parseSnapshots('null')).toBeNull()
    expect(parseSnapshots('"string"')).toBeNull()
  })

  it('returns an empty object for {}', () => {
    expect(parseSnapshots('{}')).toEqual({})
  })

  it('returns parsed profiles for valid input', () => {
    const profiles = {
      A: { title: { text: 'hello' } },
      B: { title: { text: 'world' } },
    }
    expect(parseSnapshots(JSON.stringify(profiles))).toEqual(profiles)
  })
})
