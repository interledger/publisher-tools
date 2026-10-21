import { describe, it, expect } from 'vitest'
import { isWalletAddress } from './index.js'

const baseWallet = {
  id: 'https://wallet.example/alice',
  assetCode: 'USD',
  assetScale: 2,
  authServer: 'https://auth.wallet.example',
  resourceServer: 'https://wallet.example',
}

describe('isWalletAddress', () => {
  it('returns true for a valid wallet address with assetScale 2', () => {
    expect(isWalletAddress(baseWallet)).toBe(true)
  })

  it('returns true for assetScale of 0 (e.g. JPY-style currencies with no minor unit)', () => {
    expect(isWalletAddress({ ...baseWallet, assetScale: 0 })).toBe(true)
  })

  it('returns false when assetScale is missing', () => {
    const { assetScale: _, ...withoutScale } = baseWallet
    expect(isWalletAddress(withoutScale)).toBe(false)
  })

  it('returns false when assetScale is a string instead of a number', () => {
    expect(isWalletAddress({ ...baseWallet, assetScale: '2' })).toBe(false)
  })

  it('returns false when id is missing', () => {
    const { id: _, ...withoutId } = baseWallet
    expect(isWalletAddress(withoutId)).toBe(false)
  })

  it('returns false when assetCode is missing', () => {
    const { assetCode: _, ...withoutCode } = baseWallet
    expect(isWalletAddress(withoutCode)).toBe(false)
  })

  it('returns false when authServer is missing', () => {
    const { authServer: _, ...withoutAuth } = baseWallet
    expect(isWalletAddress(withoutAuth)).toBe(false)
  })

  it('returns false when resourceServer is missing', () => {
    const { resourceServer: _, ...withoutRS } = baseWallet
    expect(isWalletAddress(withoutRS)).toBe(false)
  })

  it('returns false for null', () => {
    expect(isWalletAddress(null)).toBe(false)
  })

  it('returns false for a plain string', () => {
    expect(isWalletAddress('https://wallet.example/alice')).toBe(false)
  })
})
