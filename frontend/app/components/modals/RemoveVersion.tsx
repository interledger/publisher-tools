import { Dialog } from '@headlessui/react'
import { useFetcher } from '@remix-run/react'
import { useEffect } from 'react'
import type { ElementConfigType } from '@shared/types'
import { XIcon } from '~/components/icons.js'
import { Button } from '~/components/index.js'
import type { ModalType } from '~/lib/presets.js'

type RemoveVersionModalProps = {
  title: string
  versionToRemove: string
  isOpen: boolean
  onClose: () => void
  toolConfig: ElementConfigType
  setConfigs: (
    config: Record<string, ElementConfigType>,
    versionName: string
  ) => void
  elementType: string
  setModalOpen: React.Dispatch<React.SetStateAction<ModalType | undefined>>
}

export const RemoveVersionModal = ({
  title,
  versionToRemove,
  isOpen,
  onClose,
  toolConfig,
  setConfigs,
  elementType,
  setModalOpen
}: RemoveVersionModalProps) => {
  const deleteFetcher = useFetcher()
  const isSubmitting = deleteFetcher.state !== 'idle'

  useEffect(() => {
    if (deleteFetcher.data && deleteFetcher.state === 'idle') {
      // @ts-expect-error TODO
      if (deleteFetcher.data?.grantRequired) {
        onClose()
        setModalOpen({
          type: 'wallet-ownership',
          // @ts-expect-error TODO
          grantRedirectURI: deleteFetcher.data.grantRequired
        })
      }

      // @ts-expect-error TODO
      if (deleteFetcher.data.default) {
        sessionStorage.setItem('fullconfig', JSON.stringify(deleteFetcher.data))
        sessionStorage.setItem('new-version', 'default')
        // @ts-expect-error TODO
        setConfigs(deleteFetcher.data, 'default')
        onClose()
      }
    }
  }, [deleteFetcher.data, deleteFetcher.state])

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
                <deleteFetcher.Form
                  id="remove-version-form"
                  method="delete"
                  action={`/api/config/${elementType}`}
                >
                  <fieldset disabled={isSubmitting}>
                    <div className="flex justify-center p-4 mx-2">
                      {`Are you sure you want to remove the version "${versionToRemove}" ?`}
                      <input
                        type="hidden"
                        name="walletAddress"
                        value={toolConfig.walletAddress || ''}
                      />
                      <input
                        type="hidden"
                        name="version"
                        value={versionToRemove}
                      />
                      <input type="hidden" name="intent" value="delete" />
                    </div>
                    <div className="flex justify-center space-x-4 mt-4">
                      <Button
                        className="bg-red-500 hover:bg-red-600"
                        aria-label="remove version"
                        disabled={isSubmitting}
                        type="submit"
                      >
                        {isSubmitting ? 'Removing...' : 'Remove'}
                      </Button>
                    </div>
                  </fieldset>
                </deleteFetcher.Form>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  )
}
