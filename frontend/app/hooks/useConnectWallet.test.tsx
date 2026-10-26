import { beforeAll, describe, expect, it, vi } from 'vitest'
import { act, renderHook, screen } from '@testing-library/react'
import { PROFILE_B } from '@shared/types'
import { useConnectWallet } from '~/hooks/useConnectWallet'
import { paywall } from '~/stores/paywall-store'
import { toolActions } from '~/stores/toolStore'
import { UIProvider } from '~/stores/uiStore'
import type { WalletActions, WalletStore } from '~/stores/wallet-store'
import { widget } from '~/stores/widget-store'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function () {
    this.open = false
  }
})

describe('useConnectWallet', () => {
  it('asks before replacing unsaved paywall changes', async () => {
    toolActions.setCurrentToolType('paywall')
    widget.profilesUpdate.clear()
    paywall.profilesUpdate.add(PROFILE_B)
    vi.spyOn(toolActions, 'getToolProfiles').mockResolvedValue({})
    const setToolProfiles = vi.spyOn(toolActions, 'setToolProfiles')
    const walletActions = {
      setWalletConnected: vi.fn(),
      setHasRemoteConfigs: vi.fn(),
    } as unknown as WalletActions

    const { result } = renderHook(
      () => useConnectWallet({} as WalletStore, walletActions),
      { wrapper: UIProvider },
    )
    await act(() => result.current.connect())

    expect(screen.getByText(/We found previous edits/)).toBeInTheDocument()
    expect(setToolProfiles).not.toHaveBeenCalled()
    expect(walletActions.setWalletConnected).not.toHaveBeenCalled()
  })
})
