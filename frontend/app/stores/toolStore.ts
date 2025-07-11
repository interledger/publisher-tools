import { proxy, subscribe } from 'valtio'
import type { ElementConfigType } from '~/lib/types.js'
import type { ModalType } from '~/lib/presets.js'
import type { SelectOption } from '~/components/index.js'
import { APP_BASEPATH } from '~/lib/constants'
import type { StepStatus } from '~/components/redesign/components/StepsIndicator'
const STORAGE_KEY = 'valtio-store'
import { getDefaultData } from '~/lib/utils'

interface SaveConfigResponse {
  grantRequired?: string
  intent?: string
  error?: string
  [key: string]: unknown
}

function initializeFullConfigWithDefaults(): Record<string, ElementConfigType> {
  const defaultData = getDefaultData()
  return {
    tab1: { ...defaultData },
    tab2: { ...defaultData },
    tab3: { ...defaultData }
  }
}

export const toolState = proxy({
  toolConfig: getDefaultData() as ElementConfigType,
  fullConfig: initializeFullConfigWithDefaults(),

  selectedVersion: 'tab1',
  versionOptions: [
    { label: 'Default preset 1', value: 'tab1' },
    { label: 'Default preset 2', value: 'tab2' },
    { label: 'Default preset 3', value: 'tab3' }
  ] as SelectOption[],
  modal: undefined as ModalType | undefined,
  resubmitActionType: 'save-success' as 'save-success' | 'script',

  isSubmitting: false,
  fetcherState: 'idle' as 'idle' | 'loading' | 'submitting',

  elementType: null as string | null,
  scriptInitUrl: '',
  apiUrl: '',
  walletAddress: '',
  grantResponse: '',
  isGrantAccepted: false,
  isWalletConnected: false,
  hasCustomEdits: false,
  walletConnectStep: 'unfilled' as StepStatus,
  buildStep: 'unfilled' as StepStatus
})

export const toolActions = {
  setToolConfig: (config: Partial<ElementConfigType>) => {
    toolState.toolConfig = {
      ...toolState.toolConfig,
      ...config
    }

    if (toolState.selectedVersion) {
      toolState.fullConfig[toolState.selectedVersion] = {
        ...toolState.toolConfig
      }
    }
  },

  setFullConfig: (fullConfig: Record<string, ElementConfigType>) => {
    toolState.fullConfig = fullConfig
  },
  setConfigs: (fullConfigObject?: Record<string, ElementConfigType> | null) => {
    const providedKeys = fullConfigObject ? Object.keys(fullConfigObject) : []
    const defaultData = getDefaultData()
    const defaultVersionKeys = ['tab1', 'tab2', 'tab3']

    const newVersionOptions: SelectOption[] = []
    const newFullConfig: Record<string, ElementConfigType> = {}

    defaultVersionKeys.forEach((defaultKey, index) => {
      const hasProvidedKey = providedKeys[index] !== undefined
      const versionKey = hasProvidedKey ? providedKeys[index] : defaultKey
      const versionLabel = hasProvidedKey
        ? providedKeys[index]
        : `Default preset ${index + 1}`

      newVersionOptions.push({
        label: versionLabel,
        value: versionKey
      })

      newFullConfig[versionKey] = {
        ...defaultData,
        ...(fullConfigObject?.[versionKey] || {})
      }
    })

    toolState.versionOptions = newVersionOptions
    toolState.fullConfig = newFullConfig
    toolState.selectedVersion = newVersionOptions[0].value
    toolState.toolConfig = newFullConfig[toolState.selectedVersion]
  },
  selectVersion: (selectedVersion: string) => {
    if (toolState.selectedVersion && toolState.toolConfig) {
      toolState.fullConfig[toolState.selectedVersion] = {
        ...toolState.toolConfig
      }
    }

    const newConfig = toolState.fullConfig[selectedVersion]
    if (!newConfig) {
      throw new Error(`Version '${selectedVersion}' not found`)
    }

    toolState.toolConfig = newConfig
    toolState.selectedVersion = selectedVersion
  },

  setModal: (modal: ModalType | undefined) => {
    toolState.modal = modal
  },

  setSubmitting: (isSubmitting: boolean) => {
    toolState.isSubmitting = isSubmitting
  },

  setFetcherState: (state: 'idle' | 'loading' | 'submitting') => {
    toolState.fetcherState = state
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
    if (!toolState.toolConfig.walletAddress) {
      return undefined
    }

    const wa = toolState.toolConfig.walletAddress
      .replace('$', '')
      .replace('https://', '')
    return `<script id="wmt-init-script" type="module" src="${toolState.scriptInitUrl}init.js?wa=${wa}&tag=${toolState.selectedVersion}&types=banner"></script>`
  },
  updateVersionLabel: (oldVersionKey: string, newVersionName: string) => {
    const targetOption = toolState.versionOptions.find(
      (option) => option.value === oldVersionKey
    )
    if (targetOption) {
      targetOption.label = newVersionName
      targetOption.value = newVersionName
    }

    const existingConfig = toolState.fullConfig[oldVersionKey]
    if (!existingConfig) {
      return
    }

    delete toolState.fullConfig[oldVersionKey]
    toolState.fullConfig[newVersionName] = existingConfig

    if (toolState.selectedVersion === oldVersionKey) {
      toolState.selectedVersion = newVersionName
    }
  },
  setWalletAddress: (walletAddress: string) => {
    toolState.walletAddress = walletAddress
  },

  setHasCustomEdits: (hasCustomEdits: boolean) => {
    toolState.hasCustomEdits = hasCustomEdits
  },
  saveConfig: async (
    elementType: string,
    callToActionType: 'save-success' | 'script'
  ) => {
    if (!toolState.walletAddress) {
      throw new Error('Wallet address is missing')
    }

    toolState.resubmitActionType = callToActionType
    toolState.isSubmitting = true
    try {
      const configToSave = {
        ...toolState.toolConfig,
        walletAddress: toolState.walletAddress
      }

      const formData = new FormData()
      if (configToSave.bannerFontName)
        formData.append('bannerFontName', configToSave.bannerFontName)
      if (configToSave.bannerFontSize)
        formData.append(
          'bannerFontSize',
          configToSave.bannerFontSize.toString()
        )
      if (configToSave.bannerDescriptionText)
        formData.append(
          'bannerDescriptionText',
          configToSave.bannerDescriptionText
        )
      if (configToSave.bannerTextColor)
        formData.append('bannerTextColor', configToSave.bannerTextColor)
      if (configToSave.bannerBackgroundColor)
        formData.append(
          'bannerBackgroundColor',
          configToSave.bannerBackgroundColor
        )
      if (configToSave.bannerSlideAnimation)
        formData.append(
          'bannerSlideAnimation',
          configToSave.bannerSlideAnimation
        )
      if (configToSave.bannerPosition)
        formData.append('bannerPosition', configToSave.bannerPosition)
      if (configToSave.bannerBorder)
        formData.append('bannerBorder', configToSave.bannerBorder)

      formData.append('walletAddress', toolState.walletAddress)
      formData.append('version', toolState.selectedVersion)

      const updatedFullConfig = {
        ...toolState.fullConfig,
        [toolState.selectedVersion]: configToSave
      }

      formData.append('fullconfig', JSON.stringify(updatedFullConfig))
      formData.append('intent', 'update')

      const baseUrl = location.origin + APP_BASEPATH
      const response = await fetch(`${baseUrl}/api/config/${elementType}`, {
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

      toolState.fullConfig = data as Record<string, ElementConfigType>
      toolState.toolConfig = configToSave
      toolState.modal = { type: callToActionType }

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
      toolActions.saveConfig('banner', toolState.resubmitActionType)
    } else {
      toolState.modal = {
        type: 'save-error'
      }
    }
  }
}

/** Load from localStorage on init */
export function loadState(env: Env) {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    const parsed = JSON.parse(saved)
    Object.assign(toolState, parsed)
  }
  toolState.scriptInitUrl = env.SCRIPT_EMBED_URL
}

export function persistState() {
  subscribe(toolState, () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toolState))
  })
}
