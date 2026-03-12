import { proxy, snapshot, subscribe } from 'valtio'
import type { Tool } from '@shared/types'

export type WalletStore = ReturnType<typeof createWalletState>
type StepStatus = 'unfilled' | 'filled' | 'error'

function getStorageKey(tool: Tool) {
  return `wallet-store:${tool}`
}

function createWalletState() {
  return {
    walletAddress: '',
    walletAddressId: '',
    grantResponse: '',
    isGrantAccepted: false,
    isWalletConnected: false,
    hasRemoteConfigs: false,
    walletConnectStep: 'unfilled' as StepStatus,
    buildStep: 'unfilled' as StepStatus,
  }
}

function createWalletActions(wallet: WalletStore) {
  return {
    setWalletConnected(connected: boolean) {
      wallet.isWalletConnected = connected
      wallet.walletConnectStep = connected ? 'filled' : 'unfilled'
    },
    setConnectWalletStep(step: StepStatus) {
      wallet.walletConnectStep = step
    },
    setBuildCompleteStep(step: StepStatus) {
      wallet.buildStep = step
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
    setGrantResponse(response: string, accepted: boolean) {
      wallet.grantResponse = response
      wallet.isGrantAccepted = accepted
    },
  }
}

export type WalletActions = ReturnType<typeof createWalletActions>

export function createWalletStore(tool: Tool) {
  const wallet = proxy(createWalletState())
  const storageKey = getStorageKey(tool)
  const actions = createWalletActions(wallet)

  function load() {
    try {
      const saved = localStorage.getItem(storageKey)
      if (!saved) return
      const parsed = JSON.parse(saved) as Partial<WalletStore>
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
