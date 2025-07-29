import { Dialog } from '@headlessui/react'
import type { ElementConfigType } from '@shared/types'
import type { ElementErrors } from '~/lib/types.js'
import { XIcon } from '~/components/icons.js'
import { Button } from '~/components/index.js'
import { WalletAddress } from '../WalletAddressInput.js'
import { useState } from 'react'

type ImportModalProps = {
  title: string
  basepath: string
  isOpen: boolean
  toolConfig: ElementConfigType
  setConfigs: (
    fullConfigObject: Record<string, ElementConfigType>,
    versionName: string
  ) => void
  setToolConfig: React.Dispatch<React.SetStateAction<ElementConfigType>>
  elementType: string
  onClose: () => void
  onImport?: (walletAddress: string) => void
}

export const ImportModal = ({
  title,
  basepath,
  isOpen,
  onClose,
  toolConfig,
  elementType,
  setConfigs = () => {},
  setToolConfig = () => {}
}: ImportModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<ElementErrors>()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)
      const walletAddress = formData.get('walletAddress')

      const response = await fetch(
        `${basepath}/api/config/${elementType}?walletAddress=${walletAddress}`
      )

      if (!response.ok) {
        const data = await response.json()
        // @ts-expect-error TODO
        setErrors(data.errors)
        setIsSubmitting(false)
        return
      }

      const data = await response.json()

      // @ts-expect-error TODO
      if (data.default) {
        // @ts-expect-error TODO
        setConfigs(data, 'default')
        sessionStorage.setItem('fullconfig', JSON.stringify(data))
        onClose()
      }
    } catch (error) {
      console.error('Error importing configuration:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

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
                <form id="import-form" method="get" onSubmit={handleSubmit}>
                  <fieldset disabled={isSubmitting}>
                    <div className="flex w-full items-center">
                      <WalletAddress
                        errors={errors}
                        config={toolConfig}
                        setToolConfig={setToolConfig}
                      />
                    </div>
                    <div className="flex justify-end space-x-4">
                      <Button
                        aria-label={`import config`}
                        disabled={isSubmitting}
                        type="submit"
                        value="import"
                        name="intent"
                      >
                        {isSubmitting ? 'Importing...' : 'Import'}
                      </Button>
                    </div>
                  </fieldset>
                </form>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  )
}
