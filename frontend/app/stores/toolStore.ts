import { proxy, subscribe } from 'valtio'
import { API_URL, CDN_URL } from '@shared/defines'
import {
  type Tool,
  type ProfileId,
  type ToolProfiles,
  TOOL_BANNER,
  TOOL_WIDGET,
  TOOL_OFFERWALL,
  PROFILE_A,
} from '@shared/types'
import type { StepStatus } from '~/components/redesign/components/StepsIndicator'
import { actions as bannerActions } from '~/stores/banner-store'
import { actions as offerwallActions } from '~/stores/offerwall-store'
import { actions as widgetActions } from '~/stores/widget-store'
import { omit } from '~/utils/utils.storage'
import { captureSnapshotsToStorage } from './banner-store'

const STORAGE_KEY = 'valtio-store'

const EXCLUDED_FROM_STORAGE = new Set<keyof typeof toolState>([
  'currentToolType',
  'buildStep',
  'opWallet',
  'cdnUrl',
])

export const toolState = proxy({
  activeTab: PROFILE_A as ProfileId,
  currentToolType: 'unknown' as Tool,

  // UI state
  lastSaveAction: 'save-success' as 'save-success' | 'script',

  // loading states
  isSubmitting: false,
  loadingState: 'idle' as 'idle' | 'loading' | 'submitting',

  // build-time constants
  cdnUrl: '',
  apiUrl: '',

  // environment variables
  opWallet: '',

  // wallet and connection state
  walletAddress: '',
  walletAddressId: '',
  grantResponse: '',
  isGrantAccepted: false,
  isWalletConnected: false,
  hasRemoteConfigs: false,
  walletConnectStep: 'unfilled' as StepStatus,
  buildStep: 'unfilled' as StepStatus,
})

export const toolActions = {
  setActiveTab(profileId: ProfileId) {
    toolState.activeTab = profileId
  },
  async getToolProfiles<T extends Tool>(): Promise<ToolProfiles<T>> {
    switch (toolState.currentToolType) {
      case TOOL_BANNER:
        return (await bannerActions.getProfiles(TOOL_BANNER)) as ToolProfiles<T>
      case TOOL_WIDGET:
        return (await widgetActions.getProfiles(TOOL_WIDGET)) as ToolProfiles<T>
      case TOOL_OFFERWALL:
        return (await offerwallActions.getProfiles(
          TOOL_OFFERWALL,
        )) as ToolProfiles<T>

      default:
        break
    }
  },
  setToolProfiles<T extends Tool>(profiles: ToolProfiles<T>) {
    if (!profiles) return

    switch (toolState.currentToolType) {
      case TOOL_BANNER:
        bannerActions.setProfiles(profiles as ToolProfiles<'banner'>)
        bannerActions.commitProfiles()
        break
      case TOOL_WIDGET:
        widgetActions.setProfiles(profiles as ToolProfiles<'widget'>)
        widgetActions.commitProfiles()
        break
      case TOOL_OFFERWALL:
        offerwallActions.setProfiles(profiles as ToolProfiles<'offerwall'>)
        offerwallActions.commitProfiles()
        break

      default:
        break
    }
  },
  resetProfiles() {
    for (const actions of [bannerActions, widgetActions, offerwallActions]) {
      actions.resetProfiles()
    }
  },
  setCurrentToolType: (toolType: Tool) => {
    toolState.currentToolType = toolType
  },

  setSubmitting: (isSubmitting: boolean) => {
    toolState.isSubmitting = isSubmitting
  },

  setFetcherState: (state: 'idle' | 'loading' | 'submitting') => {
    toolState.loadingState = state
  },

  setWalletConnected: (connected: boolean) => {
    toolState.isWalletConnected = connected
    if (connected) {
      toolState.walletConnectStep = 'filled'
    } else {
      toolState.walletConnectStep = 'unfilled'
    }

    captureSnapshotsToStorage()
  },

  setConnectWalletStep: (step: StepStatus) => {
    toolState.walletConnectStep = step
  },

  setBuildCompleteStep: (step: StepStatus) => {
    toolState.buildStep = step
  },
  setWalletAddress: (walletAddress: string) => {
    toolState.walletAddress = walletAddress
  },
  setWalletAddressId: (walletAddressId: string) => {
    toolState.walletAddressId = walletAddressId
  },
  setHasRemoteConfigs: (hasRemoteConfigs: boolean) => {
    toolState.hasRemoteConfigs = hasRemoteConfigs
  },
  setGrantResponse: (grantResponse: string, isGrantAccepted: boolean) => {
    toolState.grantResponse = grantResponse
    toolState.isGrantAccepted = isGrantAccepted
  },
}

/** Load from localStorage on init, remove storage if invalid */
export function loadState(OP_WALLET_ADDRESS: Env['OP_WALLET_ADDRESS']) {
  toolState.cdnUrl = CDN_URL
  toolState.apiUrl = API_URL
  toolState.opWallet = OP_WALLET_ADDRESS
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed: typeof toolState = JSON.parse(saved)
      const validKeys =
        typeof parsed === 'object' &&
        Object.keys(parsed).every((key) => key in toolState)

      if (validKeys) {
        const loadedData = parsedStorageData(parsed)
        Object.assign(toolState, loadedData)
      } else {
        throw new Error('saved configuration not valid')
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function persistState() {
  subscribe(toolState, () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(createStorageState(toolState)),
    )
  })
}

function createStorageState(state: typeof toolState) {
  return omit(state, EXCLUDED_FROM_STORAGE)
}

function parsedStorageData(parsed: Record<string, unknown>) {
  return omit(parsed, EXCLUDED_FROM_STORAGE)
}
