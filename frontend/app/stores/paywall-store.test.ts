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

function setWallet(assetCode: string, isWalletConnected: boolean) {
  paywallWallet.walletAddressInfo = { assetCode } as WalletAddress
  paywallWallet.isWalletConnected = isWalletConnected
}

describe('paywall store', () => {
  afterEach(() => {
    paywallWallet.walletAddressInfo = null
    paywallWallet.isWalletConnected = false
    vi.clearAllMocks()
  })

  it("saves the price in the connected wallet's currency", async () => {
    paywall.profile.price = { value: '5.00', currency: 'USD' }
    setWallet('EUR', true)

    await actions.saveProfile()

    expect(savedPrice()).toEqual({ value: '5.00', currency: 'EUR' })
    expect(paywall.profile.price.currency).toBe('EUR')
  })

  it('leaves the profile unchanged when saving fails', async () => {
    paywall.profile.price = { value: '5.00', currency: 'USD' }
    setWallet('EUR', true)
    vi.mocked(saveToolProfile).mockResolvedValueOnce({
      error: { message: 'Server error' },
    })

    await actions.saveProfile()

    expect(savedPrice().currency).toBe('EUR')
    expect(paywall.profile.price.currency).toBe('USD')
  })

  it('leaves the profile unchanged when saving throws', async () => {
    paywall.profile.price = { value: '5.00', currency: 'USD' }
    setWallet('EUR', true)
    vi.mocked(saveToolProfile).mockRejectedValueOnce(new Error('offline'))

    await expect(actions.saveProfile()).rejects.toThrow('offline')

    expect(paywall.profile.price.currency).toBe('USD')
  })

  it('keeps the saved currency while no wallet is connected', async () => {
    paywall.profile.price = { value: '5.00', currency: 'USD' }
    // entered but not connected yet: its profiles are not loaded
    setWallet('EUR', false)

    await actions.saveProfile()

    expect(savedPrice()).toEqual({ value: '5.00', currency: 'USD' })
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
