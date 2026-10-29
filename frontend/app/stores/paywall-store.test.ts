import { afterEach, describe, expect, it, vi } from 'vitest'
import type { WalletAddress } from '@interledger/open-payments'
import { createDefaultPaywallProfile } from '@shared/default-data'
import type { PaywallProfile } from '@shared/types'
import { saveToolProfile } from '~/utils/profile-api'
import { actions, paywall, paywallWallet } from './paywall-store'

vi.mock('~/utils/profile-api', () => ({
  getToolProfiles: vi.fn(),
  saveToolProfile: vi.fn(async () => ({ success: true })),
}))

const savedPrice = () =>
  (vi.mocked(saveToolProfile).mock.calls[0][2] as PaywallProfile).price

describe('paywall store', () => {
  afterEach(() => {
    paywallWallet.walletAddressInfo = null
    vi.clearAllMocks()
  })

  it("saves the price in the connected wallet's currency", async () => {
    paywall.profile.price = { value: '5.00', currency: 'USD' }
    paywallWallet.walletAddressInfo = { assetCode: 'EUR' } as WalletAddress

    await actions.saveProfile()

    expect(savedPrice()).toEqual({
      value: '5.00',
      currency: 'EUR',
    })
    expect(paywall.profile.price.currency).toBe('EUR')
  })

  it('keeps the saved currency while no wallet is known', async () => {
    paywall.profile.price = { value: '5.00', currency: 'USD' }

    await actions.saveProfile()

    expect(savedPrice()).toEqual({
      value: '5.00',
      currency: 'USD',
    })
  })

  it('restores defaults only for the given section', () => {
    const defaults = createDefaultPaywallProfile('Default')
    paywall.profile.$name = 'My paywall'
    paywall.profile.title.text = 'Custom title'
    paywall.profile.colors.background = '#000000'

    actions.restoreDefaultSection('content')

    expect(paywall.profile.title.text).toBe(defaults.title.text)
    expect(paywall.profile.colors.background).toBe('#000000')
    expect(paywall.profile.$name).toBe('My paywall')

    actions.restoreDefaultSection('appearance')

    expect(paywall.profile.colors.background).toBe(defaults.colors.background)
    expect(paywall.profile.$name).toBe('My paywall')
  })

  it('keeps price and placement when restoring the appearance', () => {
    paywall.profile.price.value = '5.00'
    paywall.profile.price.currency = 'EUR'
    paywall.profile.behavior.delay.value = 10
    paywall.profile.behavior.coverage.value = 75

    actions.restoreDefaultSection('appearance')

    expect(paywall.profile.price).toEqual({ value: '5.00', currency: 'EUR' })
    expect(paywall.profile.behavior.delay.value).toBe(10)
    expect(paywall.profile.behavior.coverage.value).toBe(75)
    expect(actions.hasDefaultChanges('appearance')).toBe(false)
  })
})
