import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadStartingShares } from './revshareStore'

afterEach(() => {
  vi.unstubAllGlobals()
})

function setStoredShares(value: unknown) {
  vi.stubGlobal('window', {})
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => JSON.stringify(value)),
  })
}

describe('revshare storage', () => {
  it('starts new configurations with an even split', () => {
    expect(loadStartingShares().map((share) => share.percentage)).toEqual([
      50, 50,
    ])
  })

  it('migrates stored weights into percentages', () => {
    setStoredShares([
      { id: '1', pointer: 'one', weight: 1, isValid: true },
      { id: '2', pointer: 'two', weight: 3, isValid: true },
    ])

    expect(loadStartingShares().map((share) => share.percentage)).toEqual([
      25, 75,
    ])
  })

  it('preserves an unfinished percentage edit', () => {
    setStoredShares([
      { id: '1', pointer: 'one', percentage: 70, isValid: true },
      { id: '2', pointer: 'two', percentage: 20, isValid: true },
    ])

    expect(loadStartingShares().map((share) => share.percentage)).toEqual([
      70, 20,
    ])
  })

  it('restores shares even when an empty row was added (regression #959)', () => {
    setStoredShares([
      { id: '1', pointer: 'wallet-one', percentage: 50, isValid: true },
      { id: '2', pointer: 'wallet-two', percentage: 50, isValid: true },
      { id: '3', pointer: '', percentage: 0 },
    ])

    const shares = loadStartingShares()
    expect(shares).toHaveLength(3)
    expect(shares[0].pointer).toBe('wallet-one')
    expect(shares[1].pointer).toBe('wallet-two')
    expect(shares[2].pointer).toBe('')
  })
})
