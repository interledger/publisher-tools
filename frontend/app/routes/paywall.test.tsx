import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WalletAddress } from '@interledger/open-payments'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createDefaultPaywallProfile } from '@shared/default-data'
import { DEFAULT_PROFILE_NAMES, PROFILE_A, PROFILE_IDS } from '@shared/types'
import { paywall, paywallWallet } from '~/stores/paywall-store'
import { toolState } from '~/stores/toolStore'
import { patchProxy } from '~/utils/utils.storage'
import Paywall from './paywall'

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useLoaderData: () => ({ OP_WALLET_ADDRESS: '' }),
}))

vi.mock('~/utils/session.server', () => ({}))

// The layout needs a wallet, routing and storage; render just the step
// labels and the builder.
vi.mock('~/components/ToolLayoutWithPreview', () => ({
  ToolLayoutWithPreview: ({
    steps,
    children,
  }: {
    steps: { label: string }[]
    children: ReactNode
  }) => (
    <>
      {steps.map((step) => (
        <h2 key={step.label}>{step.label}</h2>
      ))}
      {children}
    </>
  ),
}))

vi.mock('~/components/paywall/PaywallPreview', () => ({
  PaywallPreview: () => null,
}))

// Stands in for the content and appearance sections: shows the title of the
// profile it edits.
vi.mock('~/components/paywall/PaywallBuilder', async () => {
  const { usePaywallProfile } = await import('~/stores/paywall-store')
  return {
    PaywallBuilder: () => {
      const [snap] = usePaywallProfile()
      return <p data-testid="build-step">{snap.title.text}</p>
    },
  }
})

// valtio notifies React asynchronously, so let the update settle in act()
async function setWalletCurrency(assetCode: string) {
  await act(async () => {
    paywallWallet.walletAddressInfo = { assetCode } as WalletAddress
  })
}

describe('paywall route', () => {
  beforeEach(() => {
    toolState.activeTab = PROFILE_A
    paywallWallet.walletAddressInfo = null
    PROFILE_IDS.forEach((id, idx) => {
      const profile = createDefaultPaywallProfile(DEFAULT_PROFILE_NAMES[id])
      profile.title.text = `Title ${idx + 1}`
      profile.price.value = `${idx + 1}.00`
      patchProxy(paywall.profiles[id], profile)
    })
  })

  it('shows a tab for each version, with the first one selected', () => {
    render(<Paywall />)

    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'Default layout 1',
      'Default layout 2',
      'Default layout 3',
    ])
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('has one Build step with price, placement and content in the tabs', () => {
    render(<Paywall />)

    expect(
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent),
    ).toEqual(['Build'])

    const panel = screen.getByRole('tabpanel', { name: 'Default layout 1' })
    expect(within(panel).getByLabelText('Amount')).toBeInTheDocument()
    expect(
      within(panel).getByRole('textbox', { name: 'Show paywall after' }),
    ).toBeInTheDocument()
    expect(within(panel).getByTestId('build-step')).toBeInTheDocument()
  })

  it('shows the price and content of the selected version', async () => {
    const user = userEvent.setup()
    render(<Paywall />)

    expect(screen.getByLabelText('Amount')).toHaveValue('1.00')
    expect(screen.getByTestId('build-step')).toHaveTextContent('Title 1')

    await user.click(screen.getByRole('tab', { name: 'Default layout 2' }))

    expect(toolState.activeTab).toBe('version2')
    expect(
      screen.getByRole('tab', { name: 'Default layout 2' }),
    ).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByLabelText('Amount')).toHaveValue('2.00')
    expect(screen.getByTestId('build-step')).toHaveTextContent('Title 2')
  })

  it('edits the price of the selected version only', async () => {
    const user = userEvent.setup()
    render(<Paywall />)

    await user.click(screen.getByRole('tab', { name: 'Default layout 3' }))
    const amount = screen.getByLabelText('Amount')
    await user.clear(amount)
    await user.type(amount, '7.5')

    expect(paywall.profiles.version3.price.value).toBe('7.5')
    expect(paywall.profiles.version1.price.value).toBe('1.00')
    expect(paywall.profiles.version2.price.value).toBe('2.00')
  })

  it("sets the wallet's currency on each version as it is selected", async () => {
    const user = userEvent.setup()
    render(<Paywall />)

    await setWalletCurrency('EUR')
    expect(paywall.profiles.version1.price.currency).toBe('EUR')

    await user.click(screen.getByRole('tab', { name: 'Default layout 2' }))
    expect(paywall.profiles.version2.price.currency).toBe('EUR')
  })

  it('renames the selected version', async () => {
    const user = userEvent.setup()
    render(<Paywall />)

    await user.click(screen.getByRole('tab', { name: 'Default layout 2' }))
    await user.dblClick(screen.getByRole('tab', { name: 'Default layout 2' }))
    const input = screen.getByPlaceholderText('Preset name')
    await user.clear(input)
    await user.type(input, 'Members{Enter}')

    expect(paywall.profiles.version2.$name).toBe('Members')
    expect(paywall.profiles.version1.$name).toBe('Default layout 1')
  })
})
