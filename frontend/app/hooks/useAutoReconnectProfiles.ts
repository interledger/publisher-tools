import { useEffect, useRef } from 'react'
import { PROFILE_IDS, type Tool } from '@shared/types'
import { hasLocalProfileEdits as bannerHasLocalProfileEdits } from '~/stores/banner-store'
import { hasLocalProfileEdits as offerwallHasLocalProfileEdits } from '~/stores/offerwall-store'
import { toolState } from '~/stores/toolStore'
import { hasLocalProfileEdits as widgetHasLocalProfileEdits } from '~/stores/widget-store'
import { getStorageKeys } from '~/utils/utilts.store'
import { useConnectWallet } from './useConnectWallet'

const profileEditCheckers: Partial<Record<Tool, () => boolean>> = {
  banner: bannerHasLocalProfileEdits,
  widget: widgetHasLocalProfileEdits,
  offerwall: offerwallHasLocalProfileEdits,
}

function currentToolHasPendingUpdates(): boolean {
  return profileEditCheckers[toolState.currentToolType]?.() ?? false
}

export const useAutoReconnectProfiles = () => {
  const { connect, disconnect } = useConnectWallet()
  const connectRef = useRef(connect)
  const disconnectRef = useRef(disconnect)
  connectRef.current = connect
  disconnectRef.current = disconnect

  useEffect(() => {
    if (!toolState.isWalletConnected) return

    const { currentToolType } = toolState
    if (currentToolHasPendingUpdates()) {
      // disconnect and preserve tool in-progress changes, so the user can reconnect on their own terms
      disconnectRef.current({ preserveTool: currentToolType })
      return
    }

    const { getProfileStorageKey } = getStorageKeys(currentToolType)
    const hasLocalProfiles = PROFILE_IDS.some(
      (id) => localStorage.getItem(getProfileStorageKey(id)) !== null,
    )

    if (!hasLocalProfiles) {
      // skip call entirely if tool profiles are already in local storage
      connectRef.current()
    }
  }, [])
}
