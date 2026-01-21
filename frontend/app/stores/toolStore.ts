import { proxy, subscribe, useSnapshot } from 'valtio'
import { proxySet } from 'valtio/utils'
import { getDefaultData } from '@shared/default-data'
import { API_URL, CDN_URL } from '@shared/defines'
import type { ElementConfigType, ProfileId } from '@shared/types'
import type { StepStatus } from '~/components/redesign/components/StepsIndicator'
import { APP_BASEPATH } from '~/lib/constants'
import { omit } from '~/utils/utils.storage'
import { captureSnapshotsToStorage } from './banner-store'

const STORAGE_KEY = 'valtio-store'

const EXCLUDED_FROM_STORAGE = new Set<keyof typeof toolState>([
  'currentToolType',
  'buildStep',
  'opWallet',
  'cdnUrl',
])

export const TOOL_TYPES = [
  'banner',
  'banner-two',
  'widget',
  'button',
  'unknown',
] as const
const STABLE_KEYS = ['version1', 'version2', 'version3'] as const
const DEFAULT_VERSION_NAMES = [
  'Default preset 1',
  'Default preset 2',
  'Default preset 3',
] as const

export type StableKey = (typeof STABLE_KEYS)[number]
export type ToolType = (typeof TOOL_TYPES)[number]

interface SaveConfigResponse {
  grantRequired?: string
  intent?: string
  error?: string
  [key: string]: unknown
}

const createDefaultConfig = (versionName: string): ElementConfigType => ({
  ...getDefaultData(),
  versionName,
})

const createDefaultConfigs = (): Record<StableKey, ElementConfigType> => {
  return STABLE_KEYS.reduce(
    (configs, key, index) => {
      configs[key] = createDefaultConfig(DEFAULT_VERSION_NAMES[index])
      return configs
    },
    {} as Record<StableKey, ElementConfigType>,
  )
}

export const toolState = proxy({
  configurations: createDefaultConfigs(),
  /*
   * savedConfigurations: baseline configs.
   * tracks the configurations that are saved persistently,
   * used to compare against local modifications.
   */
  savedConfigurations: createDefaultConfigs(),
  /*
   * dirtyProfiles: tracks the configurations that are modified locally.
   */
  dirtyProfiles: proxySet<StableKey>(),
  /** @deprecated */
  activeVersion: 'version1' as StableKey,
  activeTab: 'version1' as ProfileId,
  currentToolType: 'unknown' as ToolType,

  /** always returns the active configuration */
  get currentConfig() {
    return this.configurations[this.activeVersion]
  },

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

subscribe(toolState, () => {
  updateChangesTracking(toolState.activeVersion)
})

export function useCurrentConfig(options?: {
  sync: boolean
}): [ElementConfigType, ElementConfigType] {
  // https://github.com/pmndrs/valtio/issues/132
  const snapshot = useSnapshot(toolState, options).currentConfig
  return [snapshot, toolState.currentConfig]
}

export const toolActions = {
  get versionOptions() {
    return STABLE_KEYS.map((key) => ({
      stableKey: key,
      versionName: toolState.configurations[key].versionName,
    }))
  },
  setActiveTab(profileId: ProfileId) {
    toolState.activeTab = profileId
  },
  /** legacy backwards compatibility */
  setConfigs: (
    fullConfigObject: Record<StableKey, Partial<ElementConfigType>> | null,
  ) => {
    const newFullConfig: Record<StableKey, ElementConfigType> =
      createDefaultConfigs()

    STABLE_KEYS.forEach((profileId) => {
      if (!fullConfigObject || !fullConfigObject[profileId]) {
        return
      }

      newFullConfig[profileId] = {
        ...newFullConfig[profileId],
        ...fullConfigObject[profileId],
      }

      toolState.configurations[profileId] = { ...newFullConfig[profileId] }

      toolState.savedConfigurations[profileId] = { ...newFullConfig[profileId] }
    })

    toolState.dirtyProfiles.clear()
  },

  setCurrentToolType: (toolType: ToolType) => {
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

  /**
   * Checks if any local changes have been made to the configurations.
   */
  hasCustomEdits: (): boolean => toolState.dirtyProfiles.size > 0,
  saveConfig: async () => {
    if (!toolState.walletAddress) {
      throw new Error('Wallet address is missing')
    }

    toolState.isSubmitting = true
    try {
      const configToSave = {
        ...toolState.currentConfig,
        walletAddress: toolState.walletAddress,
      }

      const formData = new FormData()

      Object.entries(configToSave).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'walletAddress') {
          formData.append(key, String(value))
        }
      })

      formData.append('walletAddress', toolState.walletAddress)
      formData.append('version', toolState.activeVersion)

      const updatedFullConfig = {
        ...toolState.configurations,
        [toolState.activeVersion]: configToSave,
      }

      formData.append('fullconfig', JSON.stringify(updatedFullConfig))
      formData.append('intent', 'update')

      const baseUrl = location.origin + APP_BASEPATH
      const url = new URL(`${baseUrl}/api/config/${toolState.currentToolType}`)
      const response = await fetch(url, {
        method: 'PUT',
        body: formData,
      })
      if (!response.ok) {
        const details = await response.json()
        throw new Error(`Save request failed with status: ${response.status}`, {
          cause: { details },
        })
      }

      const data = (await response.json()) as SaveConfigResponse
      if (data?.grantRequired) {
        return { success: false, data }
      }

      STABLE_KEYS.forEach((profileId) => {
        toolState.savedConfigurations[profileId] = {
          ...toolState.configurations[profileId],
        }
      })
      toolState.dirtyProfiles.clear()

      return { success: true, data }
    } catch (error) {
      console.error('Save error:', error)
      throw error
    } finally {
      toolState.isSubmitting = false
    }
  },

  setGrantResponse: (grantResponse: string, isGrantAccepted: boolean) => {
    toolState.grantResponse = grantResponse
    toolState.isGrantAccepted = isGrantAccepted
  },

  handleTabSelect: (profileId: StableKey) => {
    toolState.activeVersion = profileId
  },

  handleVersionNameChange: (newName: string) => {
    toolState.currentConfig.versionName = newName
  },
}

function isConfigModified(profileId: StableKey): boolean {
  const currentConfig = toolState.configurations[profileId]
  const savedConfig = toolState.savedConfigurations[profileId]

  if (!currentConfig || !savedConfig) {
    return false
  }

  return JSON.stringify(currentConfig) !== JSON.stringify(savedConfig)
}

function updateChangesTracking(profileId: StableKey) {
  const isModified = isConfigModified(profileId)
  if (isModified) {
    toolState.dirtyProfiles.add(profileId)
  } else {
    toolState.dirtyProfiles.delete(profileId)
  }
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
  const omitted = omit(state, EXCLUDED_FROM_STORAGE)

  return {
    ...omitted,
    dirtyProfiles: Array.from(state.dirtyProfiles),
  }
}

function parsedStorageData(parsed: Record<string, unknown>) {
  const omitted = omit(parsed, EXCLUDED_FROM_STORAGE)

  return {
    ...omitted,
    dirtyProfiles: proxySet<StableKey>(
      Array.isArray(parsed.dirtyProfiles) ? parsed.dirtyProfiles : [],
    ),
  }
}
