import { proxy, snapshot, subscribe } from 'valtio'
import type { WalletAddress } from '@interledger/open-payments'
import type { Tool } from '@shared/types'
import { parseWithShape, subscribeToStorage } from '~/utils/utils.storage'
import type { StepStatus } from './toolStore'

export type WalletStore = ReturnType<typeof createWalletState>

function getStorageKey(tool: Tool) {
  return `wmt-${tool}-wallet`
}

function createWalletState() {
  return {
    walletAddress: '',
    walletAddressId: '',
    walletAddressInfo: null as WalletAddress | null,
    isWalletConnected: false,
    hasRemoteConfigs: false,
    walletConnectStep: 'unfilled' as StepStatus,
  }
}

function createWalletActions(wallet: WalletStore, storageKey: string) {
  return {
    setWalletConnected(connected: boolean) {
      wallet.isWalletConnected = connected
      wallet.walletConnectStep = connected ? 'filled' : 'unfilled'
    },
    setConnectWalletStep(step: StepStatus) {
      wallet.walletConnectStep = step
    },
    setWalletAddress(address: string) {
      wallet.walletAddress = address
    },
    setWalletAddressId(id: string) {
      wallet.walletAddressId = id
    },
    setWalletAddressInfo(info: WalletAddress | null) {
      wallet.walletAddressInfo = info
    },
    setHasRemoteConfigs(has: boolean) {
      wallet.hasRemoteConfigs = has
    },
    clearWalletStorage() {
      localStorage.removeItem(storageKey)
    },
  }
}

export type WalletActions = ReturnType<typeof createWalletActions>

export function createWalletStore(tool: Tool) {
  const wallet = proxy(createWalletState())
  const storageKey = getStorageKey(tool)
  const actions = createWalletActions(wallet, storageKey)

  function load() {
    const raw = localStorage.getItem(storageKey)
    const parsed = parseWithShape(raw, wallet)
    if (parsed) {
      Object.assign(wallet, parsed)
    } else if (raw !== null) {
      localStorage.removeItem(storageKey)
    }
  }

  function persist() {
    subscribe(wallet, () => {
      localStorage.setItem(storageKey, JSON.stringify(snapshot(wallet)))
    })
  }

  function subscribeCrossTab() {
    return subscribeToStorage((event) => {
      if (event.key !== storageKey) return
      const parsed = parseWithShape(event.newValue, wallet)
      if (parsed) Object.assign(wallet, parsed)
    })
  }

  return { wallet, actions, load, persist, subscribeCrossTab }
}
