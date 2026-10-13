import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaywallPlacementBuilder } from './PaywallPlacementBuilder'

const profile = vi.hoisted(() => ({
  behavior: { coverage: { value: 50 }, delay: { value: 0 } },
}))

vi.mock('~/stores/paywall-store', () => ({
  usePaywallProfile: () => [profile, profile],
}))

describe('PaywallPlacementBuilder', () => {
  it('describes the delay input with its maximum', () => {
    render(<PaywallPlacementBuilder />)

    expect(
      screen.getByRole('textbox', { name: 'Show paywall after' }),
    ).toHaveAccessibleDescription(
      'Maximum 15 seconds. Set to 0 to show the paywall immediately on page load.',
    )
  })

  it('clamps the delay to the maximum on blur', async () => {
    const user = userEvent.setup()
    render(<PaywallPlacementBuilder />)

    const input = screen.getByRole('textbox', { name: 'Show paywall after' })
    await user.clear(input)
    await user.type(input, '20')
    await user.tab()

    expect(input).toHaveValue('15')
    expect(profile.behavior.delay.value).toBe(15)
  })
})
