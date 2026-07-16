import { useSnapshot } from 'valtio'
import type { WalletActions, WalletStore } from '~/stores/wallet-store'

type WalletBundle = { wallet: WalletStore; actions: WalletActions }

export function useToolWallet(
  { wallet, actions }: WalletBundle,
  options?: { sync: boolean },
): [WalletStore, WalletActions] {
  const snap = useSnapshot(wallet, options)
  return [snap, actions]
}
