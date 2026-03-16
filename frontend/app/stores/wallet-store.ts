import { proxy, snapshot, subscribe } from 'valtio'
import type { Tool } from '@shared/types'
import type { StepStatus } from './toolStore'

export type WalletStore = ReturnType<typeof createWalletState>

function getStorageKey(tool: Tool) {
  return `wmt-${tool}-wallet`
}

function createWalletState() {
  return {
    walletAddress: '',
    walletAddressId: '',
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
    try {
      const saved = localStorage.getItem(storageKey)
      if (!saved) return

      const isValid = (parsed: WalletStore) =>
        typeof parsed === 'object' &&
        Object.keys(parsed).every((key) => key in parsed)

      const parsed = JSON.parse(saved)
      if (!isValid(parsed)) {
        throw new Error('Failed to parse')
      }

      Object.assign(wallet, parsed)
    } catch {
      localStorage.removeItem(storageKey)
    }
  }

  function persist() {
    subscribe(wallet, () => {
      localStorage.setItem(storageKey, JSON.stringify(snapshot(wallet)))
    })
  }

  return { wallet, actions, load, persist }
}
