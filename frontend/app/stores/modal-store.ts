import { proxy } from 'valtio'
import type { ElementConfigType } from '@shared/types'
export type ScriptModal = {
  type: 'script'
}

export type WalletOwnershipModal = {
  type: 'wallet-ownership'
  grantRedirectURI: string
  grantRedirectIntent?: string
}

export type GrantResponseModal = {
  type: 'grant-response'
  grantRedirectURI?: string
}

export type SaveErrorModal = {
  type: 'save-error'
  error: { message?: string; fieldErrors?: Record<string, string> }
  isGrantAccepted?: boolean
  grantResponse?: string
}

export type SaveSuccessModal = {
  type: 'save-success'
  message?: string
}

export type OverridePresetModal = {
  type: 'override-preset'
  fetchedConfigs: Record<string, ElementConfigType>
  currentLocalConfigs: Record<string, ElementConfigType>
  modifiedConfigs: readonly string[]
}

export type ModalType =
  | ScriptModal
  | WalletOwnershipModal
  | GrantResponseModal
  | SaveErrorModal
  | SaveSuccessModal
  | OverridePresetModal

export const store = proxy({
  modal: undefined as ModalType | undefined
})

export const modalActions = {
  setModal: (modal: ModalType | undefined) => {
    store.modal = modal
  },
  close: () => {
    store.modal = undefined
  }
}
