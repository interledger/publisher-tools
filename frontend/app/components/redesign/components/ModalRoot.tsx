import React from 'react'
import { useSnapshot } from 'valtio'
import {
  ScriptReadyModal,
  StatusModal,
  WalletOwnershipModal,
  OverridePresetModal
} from '@/components'
import { modalActions, store } from '~/stores/modal-store'

export const ModalRoot: React.FC = () => {
  const snap = useSnapshot(store)

  switch (snap.modal?.type) {
    case 'script':
      return <ScriptReadyModal />
    case 'save-success':
      return <StatusModal onDone={() => modalActions.close()} />
    case 'save-error':
      return (
        <StatusModal
          onDone={() => modalActions.close()}
          fieldErrors={snap.modal?.error?.fieldErrors}
          message={
            snap.modal.error?.message ||
            (!snap.modal.isGrantAccepted
              ? String(snap.modal.grantResponse)
              : 'Error saving your edits')
          }
        />
      )
    case 'wallet-ownership':
      return (
        <WalletOwnershipModal grantRedirect={snap.modal.grantRedirectURI} />
      )
    case 'override-preset':
      return (
        <OverridePresetModal
          fetchedConfigs={snap.modal?.fetchedConfigs}
          currentLocalConfigs={snap.modal?.currentLocalConfigs}
          modifiedVersions={snap.modal?.modifiedConfigs || []}
        />
      )

    default:
      return <></>
  }
}
