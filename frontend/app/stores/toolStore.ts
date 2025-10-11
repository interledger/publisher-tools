import { proxy, subscribe } from 'valtio'
import { APP_BASEPATH } from '~/lib/constants'
import { getDefaultData } from '@shared/default-data'
import { API_URL, CDN_URL } from '@shared/defines'
import type { StepStatus } from '~/components/redesign/components/StepsIndicator'
import type { ElementConfigType } from '@shared/types'
import type { ModalType } from '~/lib/types'
import { groupBy, toWalletAddressUrl } from '@shared/utils'

const STORAGE_KEY = 'valtio-store'

const EXCLUDED_FROM_STORAGE = new Set<keyof typeof toolState>([
  'currentToolType',
  'buildStep',
  'opWallet',
  'cdnUrl'
])

export const TOOL_TYPES = ['banner', 'widget', 'button', 'unknown'] as const
const STABLE_KEYS = ['version1', 'version2', 'version3'] as const
const DEFAULT_VERSION_NAMES = [
  'Default preset 1',
  'Default preset 2',
  'Default preset 3'
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
  versionName
})

const createDefaultConfigs = (): Record<StableKey, ElementConfigType> => {
  return STABLE_KEYS.reduce(
    (configs, key, index) => {
      configs[key] = createDefaultConfig(DEFAULT_VERSION_NAMES[index])
      return configs
    },
    {} as Record<StableKey, ElementConfigType>
  )
}

function updateModificationTracking(stableKey: StableKey) {
  const currentConfig = toolState.configurations[stableKey]
  const savedConfig = toolState.savedConfigurations[stableKey]

  if (!currentConfig || !savedConfig) {
    return
  }

  const hasContentChanges =
    JSON.stringify(currentConfig) !== JSON.stringify(savedConfig)

  const hasVersionNameChanges =
    currentConfig.versionName !== savedConfig.versionName

  const isModified = hasContentChanges || hasVersionNameChanges

  const currentIndex = toolState.modifiedVersions.indexOf(stableKey)

  if (isModified && currentIndex === -1) {
    toolState.modifiedVersions.push(stableKey)
  } else if (!isModified && currentIndex > -1) {
    toolState.modifiedVersions.splice(currentIndex, 1)
  }
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
   * modifiedVersions: tracks the configurations that are modified locally.
   */
  modifiedVersions: [] as StableKey[],
  activeVersion: 'version1' as StableKey,
  currentToolType: 'unknown' as ToolType,

  /** always returns the active configuration */
  get currentConfig() {
    return this.configurations[this.activeVersion]
  },

  // UI state
  modal: undefined as ModalType | undefined,
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
  buildStep: 'unfilled' as StepStatus
})

subscribe(toolState, () => {
  updateModificationTracking(toolState.activeVersion)
})

export const toolActions = {
  get versionOptions() {
    return STABLE_KEYS.map((key) => ({
      stableKey: key,
      versionName: toolState.configurations[key].versionName
    }))
  },

  setConfigs: (fullConfigObject: Record<string, ElementConfigType> | null) => {
    const newFullConfig: Record<StableKey, ElementConfigType> =
      createDefaultConfigs()

    STABLE_KEYS.forEach((stableKey) => {
      if (fullConfigObject) {
        newFullConfig[stableKey] = {
          ...fullConfigObject[stableKey],
          versionName: fullConfigObject[stableKey].versionName
        }
      } else {
        toolState.modifiedVersions = []
      }

      toolState.configurations[stableKey] = { ...newFullConfig[stableKey] }

      toolState.savedConfigurations[stableKey] = { ...newFullConfig[stableKey] }
    })
  },

  selectVersion: (selectedStableKey: StableKey) => {
    if (!toolState.configurations[selectedStableKey]) {
      throw new Error(`Stable key '${selectedStableKey}' not found`)
    }

    toolState.activeVersion = selectedStableKey
  },

  setModal: (modal: ModalType | undefined) => {
    toolState.modal = modal
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
  },

  setConnectWalletStep: (step: StepStatus) => {
    toolState.walletConnectStep = step
  },

  setBuildCompleteStep: (step: StepStatus) => {
    toolState.buildStep = step
  },
  getScriptToDisplay: (): string => {
    const {
      walletAddress,
      walletAddressId,
      currentToolType: toolType,
      activeVersion: preset,
      cdnUrl
    } = toolState

    const wa = toWalletAddressUrl(walletAddress)
    const src = new URL(`/${toolType}.js`, cdnUrl).href

    const script = document.createElement('script')
    script.id = `wmt-${toolType}-init-script`
    script.type = 'module'
    script.src = src
    script.dataset.walletAddress = wa
    if (walletAddressId && wa !== walletAddressId) {
      script.dataset.walletAddressId = walletAddressId
    }
    script.dataset.tag = preset
    return script.outerHTML
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
  hasCustomEdits: (): boolean => toolState.modifiedVersions.length > 0,
  saveConfig: async (callToActionType: 'save-success' | 'script') => {
    if (!toolState.walletAddress) {
      throw new Error('Wallet address is missing')
    }

    toolState.lastSaveAction = callToActionType
    toolState.isSubmitting = true
    try {
      const configToSave = {
        ...toolState.currentConfig,
        walletAddress: toolState.walletAddress
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
        [toolState.activeVersion]: configToSave
      }

      formData.append('fullconfig', JSON.stringify(updatedFullConfig))
      formData.append('intent', 'update')

      const baseUrl = location.origin + APP_BASEPATH
      const url = new URL(`${baseUrl}/api/config/${toolState.currentToolType}`)
      const response = await fetch(url, {
        method: 'PUT',
        body: formData
      })
      if (!response.ok) {
        const details = await response.json()
        throw new Error(`Save request failed with status: ${response.status}`, {
          cause: { details }
        })
      }

      const data = (await response.json()) as SaveConfigResponse

      if (data?.grantRequired) {
        toolState.modal = {
          type: 'wallet-ownership',
          grantRedirectURI: data.grantRequired,
          grantRedirectIntent: data.intent
        }
        return {
          requiresGrant: true,
          grantRedirectURI: data.grantRequired,
          grantRedirectIntent: data.intent
        }
      }

      const updatedConfigs = data as Record<string, ElementConfigType>
      STABLE_KEYS.forEach((stableKey) => {
        if (updatedConfigs[stableKey]) {
          toolState.configurations[stableKey] = { ...updatedConfigs[stableKey] }
        }
      })
      toolState.modal = { type: callToActionType }

      // update the baseline to current configurations after success save
      STABLE_KEYS.forEach((stableKey) => {
        toolState.savedConfigurations[stableKey] = {
          ...toolState.configurations[stableKey]
        }
      })
      toolState.modifiedVersions = []

      return { success: true, data }
    } catch (error) {
      console.error('Save error:', error)
      throw error
    } finally {
      toolState.isSubmitting = false
    }
  },

  confirmWalletOwnership: (grantRedirectURI?: string) => {
    if (!grantRedirectURI) {
      throw new Error('Grant redirect URI not found')
    }
    window.location.href = grantRedirectURI
  },
  setGrantResponse: (grantResponse: string, isGrantAccepted: boolean) => {
    toolState.grantResponse = grantResponse
    toolState.isGrantAccepted = isGrantAccepted
  },
  handleGrantResponse: () => {
    if (toolState.isGrantAccepted) {
      toolActions.saveConfig(toolState.lastSaveAction)
    } else {
      toolState.modal = {
        type: 'save-error'
      }
    }
  },

  /**
   * Executes the override operation by replacing local configurations with database versions.
   * This function is called after the user has made their selection in the OverridePresetModal
   * and represents the final step in the conflict resolution workflow.
   *
   * Override Process:
   * 1. Receives selectedLocalConfigs (configurations the user wants to keep)
   * 2. Retrieves fetched configurations from the modal state
   * 3. For each stable key: keeps local if selected, otherwise uses database version
   * 4. Updates currentConfig if the active version is being overridden
   * 5. Removes overridden versions from modifiedVersions array
   *
   * State Management:
   * - configurations: Updated with database versions where they exist and aren't selected to keep
   * - currentConfig: Updated if the active version is overridden
   * - modifiedVersions: Cleaned up to remove overridden configs
   * - Connection state: Updated to reflect successful override
   *
   * Important Notes:
   * - selectedLocalConfigs contains configurations the user wants to KEEP (not override)
   * - Configurations not in selectedLocalConfigs will be overridden with database versions
   * - The function automatically handles modification tracking cleanup
   * - Sets wallet connection state to indicate successful override
   *
   * @param selectedLocalConfigs - Record of configurations the user wants to keep (not override)
   */
  overrideWithFetchedConfigs: (
    selectedLocalConfigs: Record<string, ElementConfigType>
  ) => {
    const fetchedConfigs =
      toolState.modal?.type === 'override-preset'
        ? toolState.modal.fetchedConfigs
        : {}

    if (!fetchedConfigs) {
      console.error('No fetched configs found in modal state')
      return
    }

    // for each configuration, decide whether to keep local or use database
    STABLE_KEYS.forEach((stableKey) => {
      const hasLocalVersion = selectedLocalConfigs[stableKey]
      const hasDatabaseVersion = fetchedConfigs[stableKey]

      if (hasLocalVersion) {
        // keep the local version - no changes needed
      } else if (hasDatabaseVersion) {
        toolState.configurations[stableKey] = { ...hasDatabaseVersion }

        // remove from modified configs since we're using database version
        const wasModified = toolState.modifiedVersions.includes(stableKey)
        if (wasModified) {
          toolState.modifiedVersions = toolState.modifiedVersions.filter(
            (key) => key !== stableKey
          )
        }
      }
    })

    toolActions.setHasRemoteConfigs(true)
    toolActions.setWalletConnected(true)
  },

  resetWalletConnection: () => {
    toolActions.setWalletConnected(false)
    toolActions.setHasRemoteConfigs(false)
    toolActions.clearConflictState()
    toolActions.setModal(undefined)
  },

  /**
   * Fetches existing configurations from the database for a given wallet address
   * and performs conflict detection with local modifications.
   *
   * This is the core function that drives the override feature workflow:
   * 1. Makes API call to fetch saved configurations from database
   * 2. Determines if there are any saved configurations (hasCustomEdits)
   * 3. Determines if there are any local modifications (hasLocalModifications)
   * 4. Calculates conflict state: both database configs AND local modifications exist
   *
   * The returned data is used to decide the next steps:
   * - No conflict: Automatically load database configs or continue with local
   * - Conflict: Show OverridePresetModal for user to resolve
   *
   * @param walletAddress - The wallet address to fetch configurations for
   * @returns Object containing fetchedConfigs, conflict flags, and state information
   * @throws Error if wallet address is invalid or API call fails
   */
  fetchRemoteConfigs: async (walletAddress: string) => {
    const baseUrl = location.origin + APP_BASEPATH
    const tool = toolState.currentToolType
    const response = await fetch(
      `${baseUrl}/api/config/${tool}?walletAddress=${encodeURIComponent(walletAddress)}`
    )

    if (!response.ok) {
      const data = (await response.json()) as {
        errors?: { fieldErrors?: { walletAddress?: string[] } }
      }
      const errorMessage =
        data.errors?.fieldErrors?.walletAddress?.[0] ||
        `Failed to fetch configuration (${response.status})`
      throw new Error(errorMessage)
    }

    const fetchedConfigs = (await response.json()) as Record<
      string,
      ElementConfigType
    >
    const hasCustomEdits = Object.keys(fetchedConfigs).length > 0
    const hasLocalModifications = toolState.modifiedVersions.length > 0

    return {
      walletAddressId: walletAddress,
      fetchedConfigs,
      hasCustomEdits,
      hasLocalModifications,
      hasConflict: hasCustomEdits && hasLocalModifications
    }
  },

  /**
   * Handles configuration conflicts by showing the OverridePresetModal.
   *
   * This function is called when both database configurations and local modifications
   * exist for the same wallet address, creating a conflict that requires user resolution.
   *
   * It sets up the modal with all necessary data:
   * - fetchedConfigs: The configurations retrieved from the database
   * - currentLocalConfigs: The current local configurations (including modifications)
   * - modifiedConfigs: Array of stable keys that have been modified locally
   *
   * The modal will present options to the user:
   * - Keep local changes (ignore database versions)
   * - Override with database versions (lose local changes)
   * - Use different wallet address (start over)
   *
   * @param fetchedConfigs - The configurations retrieved from the database
   */
  handleConfigurationConflict: (
    fetchedConfigs: Record<string, ElementConfigType>
  ) => {
    toolActions.setModal({
      type: 'override-preset',
      fetchedConfigs,
      currentLocalConfigs: { ...toolState.configurations },
      modifiedConfigs: [...toolState.modifiedVersions]
    })
  },

  clearConflictState: () => {
    if (toolState.modal?.type === 'override-preset') {
      toolState.modal = undefined
    }
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
        Object.assign(toolState, parsedStorageData(parsed))
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
      JSON.stringify(createStorageState(toolState))
    )
  })
}

function createStorageState(state: typeof toolState) {
  return omit(state, EXCLUDED_FROM_STORAGE)
}

function parsedStorageData(parsed: Record<string, unknown>) {
  return omit(parsed, EXCLUDED_FROM_STORAGE)
}

export function omit<T extends Record<string, unknown>>(
  obj: T,
  keys: readonly (keyof T | string)[] | Set<keyof T | string>
): Partial<T> {
  const excludedKeys = keys instanceof Set ? keys : new Set(keys)

  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !excludedKeys.has(key))
  ) as Partial<T>
}

function isContentProperty(key: string): boolean {
  return key.endsWith('Text') || key.endsWith('Visible')
}

// TODO: remove with versioning changes
export function splitConfigProperties<T extends ElementConfigType>(config: T) {
  const { versionName: _versionName, ...rest } = config
  const { content = [], appearance = [] } = groupBy(
    Object.entries(rest),
    ([key]) => (isContentProperty(String(key)) ? 'content' : 'appearance')
  )

  return {
    content: Object.fromEntries(content) as Partial<T>,
    appearance: Object.fromEntries(appearance) as Partial<T>
  }
}
