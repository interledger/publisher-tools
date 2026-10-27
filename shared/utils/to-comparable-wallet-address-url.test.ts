import { describe, it, expect } from 'vitest'
import { toComparableWalletAddressUrl } from './index.js'

describe('toComparableWalletAddressUrl', () => {
  it.each([
    ['https://wallet.example/alice', 'https://wallet.example/alice'],
    ['https://wallet.example/alice/', 'https://wallet.example/alice'],
    ['https://WALLET.example/alice', 'https://wallet.example/alice'],
    ['  https://wallet.example/alice  ', 'https://wallet.example/alice'],
    ['$wallet.example/alice', 'https://wallet.example/alice'],
    ['$wallet.example', 'https://wallet.example/.well-known/pay'],
    ['https://wallet.example', 'https://wallet.example/.well-known/pay'],
    ['https://wallet.example/', 'https://wallet.example/.well-known/pay'],
    [
      'https://wallet.example/.well-known/pay',
      'https://wallet.example/.well-known/pay',
    ],
  ])('compares %j as %j', (walletAddress, expected) => {
    expect(toComparableWalletAddressUrl(walletAddress)).toBe(expected)
  })

  it('keeps different wallet addresses apart', () => {
    expect(
      toComparableWalletAddressUrl('https://wallet.example/alice'),
    ).not.toBe(toComparableWalletAddressUrl('https://wallet.example/bob'))
  })
})
