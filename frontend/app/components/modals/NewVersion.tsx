import { Dialog } from '@headlessui/react'
import { useFetcher } from '@remix-run/react'
import type { ElementConfigType } from '@shared/types'
import { XIcon } from '~/components/icons.js'
import { Button, Input, WalletAddress } from '~/components/index.js'
import { useEffect, useState } from 'react'
import type { ModalType } from '~/lib/presets.js'

type NewVersionModalProps = {
  title: string
  isOpen: boolean
  onClose: () => void
  toolConfig: ElementConfigType
  setToolConfig: React.Dispatch<React.SetStateAction<ElementConfigType>>
  setConfigs: (
    config: Record<string, ElementConfigType>,
    versionName: string
  ) => void
  elementType: string
  setModalOpen: React.Dispatch<React.SetStateAction<ModalType | undefined>>
}

export const NewVersionModal = ({
  title,
  isOpen,
  onClose,
  toolConfig,
  setToolConfig,
  setConfigs,
  elementType,
  setModalOpen
}: NewVersionModalProps) => {
  const versionFetcher = useFetcher()
  const isSubmitting = versionFetcher.state !== 'idle'
  const [versionName, setVersionName] = useState('')

  useEffect(() => {
    if (versionFetcher.data && versionFetcher.state === 'idle') {
      // @ts-expect-error TODO
      if (versionFetcher.data?.grantRequired) {
        onClose()
        setModalOpen({
          type: 'wallet-ownership',
          // @ts-expect-error TODO
          grantRedirectURI: versionFetcher.data.grantRequired
        })
      }

      // @ts-expect-error TODO
      if (versionFetcher.data.default) {
        sessionStorage.setItem(
          'fullconfig',
          JSON.stringify(versionFetcher.data)
        )
        sessionStorage.setItem('new-version', versionName)
        // @ts-expect-error TODO
        setConfigs(versionFetcher.data, versionName)
        onClose()
      }
    }
  }, [versionFetcher.data, versionFetcher.state])

  return (
    <Dialog as="div" className="relative z-10" onClose={onClose} open={isOpen}>
      <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" />
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <Dialog.Panel className="relative transform overflow-hidden rounded-lg max-w-full transition-all bg-white px-4 pb-4 pt-5 text-left shadow-xl w-full max-w-xl">
            <div className="absolute right-0 top-0 pr-4 pt-4">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={onClose}
              >
                <span className="sr-only">Close</span>
                <XIcon className="h-8 w-8" aria-hidden="true" />
              </button>
            </div>
            <div>
              <Dialog.Title
                as="h3"
                className="font-semibold leading-6 text-lg text-center"
              >
                {title}
              </Dialog.Title>
              <div className="mt-2">
                <versionFetcher.Form
                  id="new-version-form"
                  method="post"
                  action={`/api/config/${elementType}`}
                >
                  <fieldset disabled={isSubmitting}>
                    <div className="flex w-full items-center">
                      <WalletAddress
                        // @ts-expect-error TODO
                        errors={versionFetcher.data?.errors}
                        config={toolConfig}
                        setToolConfig={setToolConfig}
                      />
                    </div>
                    <div className="flex w-full items-center">
                      <div className="w-full my-4">
                        <Input
                          name="version"
                          label="Version title"
                          placeholder="Default"
                          value={versionName ?? ''}
                          error={
                            // @ts-expect-error TODO
                            versionFetcher.data?.errors?.fieldErrors?.version
                          }
                          onChange={(e) => {
                            const newValue = e.target.value
                            if (/^[a-zA-Z0-9-_ ]*$/.test(newValue)) {
                              setVersionName(newValue)
                            }
                          }}
                          withBorder
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-4">
                      <Button
                        aria-label={`new config`}
                        disabled={isSubmitting || !versionName}
                        type="submit"
                        value="newversion"
                        name="intent"
                      >
                        {isSubmitting ? 'Creating...' : 'Create'}
                      </Button>
                    </div>
                  </fieldset>
                </versionFetcher.Form>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  )
}
