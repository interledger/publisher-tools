import { proxy, subscribe } from 'valtio'
import { APP_BASEPATH } from '~/lib/constants'
import { getDefaultData } from '@shared/default-data'
import type { StepStatus } from '~/components/redesign/components/StepsIndicator'
import type { ElementConfigType } from '@shared/types'
import type { ModalType } from '~/lib/presets.js'

const STORAGE_KEY = 'valtio-store'

const EXCLUDED_FROM_STORAGE = new Set<keyof typeof toolState>([
  'currentToolType'
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

function isConfigModified(
  config: ElementConfigType,
  baselineConfig: ElementConfigType
): boolean {
  return JSON.stringify(config) !== JSON.stringify(baselineConfig)
}

function updateModificationTracking(
  versionKey: StableKey,
  isModified: boolean
) {
  const currentIndex = toolState.modifiedVersions.indexOf(versionKey)

  if (isModified && currentIndex === -1) {
    toolState.modifiedVersions.push(versionKey)
  } else if (!isModified && currentIndex > -1) {
    toolState.modifiedVersions.splice(currentIndex, 1)
  }
}

function getVersionNameByStableKey(stableKey: StableKey): string {
  return toolState.configurations[stableKey].versionName
}

function resetBaselineAfterSave() {
  toolState.savedConfigurations = { ...toolState.configurations }
  toolState.modifiedVersions = []
}

/**
 * Sets up the configurations based on the provided fullConfigObject.
 * This is a core function that initializes or updates the entire configuration state
 * and manages the baseline tracking for modification detection.
 *
 * The function handles several scenarios:
 * 1. If fullConfigObject is provided: Merges provided configs with defaults
 * 2. If fullConfigObject is null: Initializes with default configurations only
 * 3. treatAsBaseline parameter controls modification tracking behavior
 *
 * Configuration Setup Process:
 * - Creates default configurations for all stable keys
 * - Overlays provided configurations while preserving version names
 * - Sets the active version to the first stable key
 * - Updates the current config to match the active version
 *
 * Baseline Management:
 * - treatAsBaseline=true: Treats configs as saved state (no modifications)
 * - treatAsBaseline=false: Compares against existing baseline to detect modifications
 *
 * This function is used in multiple scenarios:
 * - Initial app load: Setting up default configurations
 * - Loading saved configs: Restoring previously saved state
 * - Importing configs: Merging external configuration data
 * - Override operations: Applying database configurations
 *
 * @param fullConfigObject - Configuration object to merge with defaults, or null for defaults only
 * @param treatAsBaseline - Whether to treat these configs as the new baseline (default: false)
 */
function setupConfigs(
  fullConfigObject: Record<string, ElementConfigType> | null,
  treatAsBaseline: boolean = false
) {
  let newFullConfig: Record<StableKey, ElementConfigType>

  if (fullConfigObject) {
    newFullConfig = createDefaultConfigs()

    STABLE_KEYS.forEach((stableKey) => {
      if (fullConfigObject[stableKey]) {
        newFullConfig[stableKey] = {
          ...newFullConfig[stableKey],
          ...fullConfigObject[stableKey],
          versionName: fullConfigObject[stableKey].versionName
        }
      }
    })
  } else {
    newFullConfig = createDefaultConfigs()
  }

  toolState.configurations = newFullConfig
  toolState.activeVersion = STABLE_KEYS[0]

  toolState.currentConfig = newFullConfig[toolState.activeVersion]

  if (treatAsBaseline) {
    toolState.savedConfigurations = { ...newFullConfig }
    toolState.modifiedVersions = []
  } else {
    toolState.savedConfigurations = { ...newFullConfig }
    toolState.modifiedVersions = STABLE_KEYS.filter((key) =>
      isConfigModified(newFullConfig[key], toolState.savedConfigurations[key])
    )
  }
}

/**
 * Updates modification tracking for a specific version configuration.
 * This function is called whenever a configuration or version name changes to determine
 * if the configuration should be marked as "modified" compared to the saved baseline.
 *
 * It checks two types of modifications:
 * 1. Content changes: Compares the current config with the saved baseline config
 * 2. Version name changes: Compares the current version name with the baseline version name
 *
 * If either type of change is detected, the configuration is added to the modifiedVersions array.
 * This tracking is crucial for conflict detection when connecting to a wallet address.
 *
 * @param stableKey - The stable key ('version1', 'version2', 'version3') to check
 */
function updateModificationTrackingWithVersionNames(stableKey: StableKey) {
  const configModified = isConfigModified(
    toolState.configurations[stableKey],
    toolState.savedConfigurations[stableKey]
  )

  const versionName = getVersionNameByStableKey(stableKey)
  const baselineVersionName =
    toolState.savedConfigurations[stableKey]?.versionName

  const versionNameChanged =
    baselineVersionName && versionName !== baselineVersionName

  const isModified = configModified || Boolean(versionNameChanged)

  updateModificationTracking(stableKey, isModified)
}

export const toolState = proxy({
  currentConfig: getDefaultData() as ElementConfigType,
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

  // UI state
  modal: undefined as ModalType | undefined,
  lastSaveAction: 'save-success' as 'save-success' | 'script',

  // loading states
  isSubmitting: false,
  loadingState: 'idle' as 'idle' | 'loading' | 'submitting',

  // environment variables
  scriptBaseUrl: '',
  apiUrl: '',
  opWallet: '',

  // wallet and connection state
  walletAddress: '',
  grantResponse: '',
  isGrantAccepted: false,
  isWalletConnected: false,
  hasRemoteConfigs: false,
  walletConnectStep: 'unfilled' as StepStatus,
  buildStep: 'unfilled' as StepStatus
})

export const toolActions = {
  get versionOptions() {
    return STABLE_KEYS.map((key) => ({
      stableKey: key,
      versionName: toolState.configurations[key].versionName
    }))
  },

  setToolConfig: (config: Partial<ElementConfigType>) => {
    toolState.currentConfig = {
      ...toolState.currentConfig,
      ...config
    }

    if (toolState.activeVersion) {
      const existingVersionName =
        toolState.configurations[toolState.activeVersion].versionName

      toolState.configurations[toolState.activeVersion] = {
        ...toolState.currentConfig,
        versionName: existingVersionName
      }

      updateModificationTrackingWithVersionNames(toolState.activeVersion)
    }
  },

  /**
   * handles both loading new configs and restoring saved configs.
   *
   * @param fullConfigObject - Configuration object to merge with defaults, or null for defaults only
   * @param treatAsBaseline - Whether to treat these configs as the new baseline (default: false)
   *   - false: Compares against existing baseline to detect modifications (for importing/loading)
   *   - true: Treats configs as saved state with no modifications (for restoring saved state)
   */
  setConfigs: (
    fullConfigObject: Record<string, ElementConfigType> | null,
    treatAsBaseline: boolean = false
  ) => {
    setupConfigs(fullConfigObject, treatAsBaseline)
  },

  selectVersion: (selectedStableKey: StableKey) => {
    if (!toolState.configurations[selectedStableKey]) {
      throw new Error(`Stable key '${selectedStableKey}' not found`)
    }

    if (toolState.activeVersion && toolState.currentConfig) {
      const existingVersionName =
        toolState.configurations[toolState.activeVersion].versionName

      toolState.configurations[toolState.activeVersion] = {
        ...toolState.currentConfig,
        versionName: existingVersionName
      }
    }

    const newConfig = toolState.configurations[selectedStableKey]
    if (!newConfig) {
      throw new Error(
        `Configuration for stable key '${selectedStableKey}' not found`
      )
    }

    toolState.currentConfig = newConfig
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
  getScriptToDisplay: (): string | undefined => {
    if (!toolState.currentConfig.walletAddress) {
      return undefined
    }

    const wa = toolState.currentConfig.walletAddress
      .replace('$', '')
      .replace('https://', '')

    return `<script id="wmt-init-script" type="module" src="${toolState.scriptBaseUrl}init.js?wa=${wa}&tag=${toolState.activeVersion}&types=${toolState.currentToolType}"></script>`
  },
  updateVersionLabel: (stableKey: StableKey, newVersionName: string) => {
    if (!toolState.configurations[stableKey]) {
      console.error(`Cannot find configuration for stable key: ${stableKey}`)
      return
    }

    toolState.configurations[stableKey] = {
      ...toolState.configurations[stableKey],
      versionName: newVersionName
    }

    if (toolState.activeVersion === stableKey) {
      toolState.currentConfig = {
        ...toolState.currentConfig,
        versionName: newVersionName
      }
    }

    updateModificationTrackingWithVersionNames(stableKey)
  },
  setWalletAddress: (walletAddress: string) => {
    toolState.walletAddress = walletAddress
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
          const stringValue =
            typeof value === 'number' ? value.toString() : value
          formData.append(key, stringValue)
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

      toolState.configurations = data as Record<string, ElementConfigType>
      toolState.currentConfig = configToSave
      toolState.modal = { type: callToActionType }

      resetBaselineAfterSave()

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
        if (toolState.activeVersion === stableKey) {
          toolState.currentConfig = { ...hasDatabaseVersion }
        }

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
  fetchAndCheckConfigurations: async (walletAddress: string) => {
    if (!walletAddress?.trim()) {
      throw new Error('Wallet address is required')
    }

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
  },

  validateWalletAddress: (walletAddress: string): boolean => {
    if (!walletAddress?.trim()) {
      return false
    }

    const trimmed = walletAddress.trim()
    return (
      trimmed.length > 0 &&
      (trimmed.startsWith('https://') ||
        trimmed.startsWith('$') ||
        trimmed.includes('.'))
    )
  }
}

/** Load from localStorage on init */
export function loadState(
  env: Pick<Env, 'SCRIPT_EMBED_URL' | 'API_URL' | 'OP_WALLET_ADDRESS'>
) {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    const parsed = JSON.parse(saved)
    Object.assign(toolState, parsedStorageData(parsed))
  }

  toolState.scriptBaseUrl = env.SCRIPT_EMBED_URL
  toolState.apiUrl = env.API_URL
  toolState.opWallet = env.OP_WALLET_ADDRESS
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

function omit<T extends Record<string, unknown>>(
  obj: T,
  keys: readonly (keyof T | string)[] | Set<keyof T | string>
): Partial<T> {
  const excludedKeys = keys instanceof Set ? keys : new Set(keys)

  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !excludedKeys.has(key))
  ) as Partial<T>
}
