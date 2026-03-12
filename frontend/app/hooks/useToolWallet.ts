import { useLocation } from 'react-router'
import { useSnapshot } from 'valtio'
import { TOOL_BANNER, TOOL_OFFERWALL, TOOL_WIDGET } from '@shared/types'
import { bannerWallet, bannerWalletActions } from '~/stores/banner-store'
import {
  offerwallWallet,
  offerwallWalletActions,
} from '~/stores/offerwall-store'
import type { WalletActions, WalletStore } from '~/stores/wallet-store'
import { widgetWallet, widgetWalletActions } from '~/stores/widget-store'

function getWalletStore(pathname: string): [WalletStore, WalletActions] {
  const tool = pathname.split('/')[1]
  switch (tool) {
    case TOOL_WIDGET:
      return [widgetWallet, widgetWalletActions]
    case TOOL_OFFERWALL:
      return [offerwallWallet, offerwallWalletActions]
    case TOOL_BANNER:
      return [bannerWallet, bannerWalletActions]

    default:
      throw new Error(`Unknown tool type: ${tool}`)
  }
}

export function useToolWallet(options?: {
  sync: boolean
}): [WalletStore, WalletActions] {
  const { pathname } = useLocation()
  const [walletProxy, actions] = getWalletStore(pathname)
  const snap = useSnapshot(walletProxy, options)
  return [snap, actions]
}
