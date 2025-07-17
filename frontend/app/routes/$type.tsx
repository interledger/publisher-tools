import { type LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import {
  useLoaderData,
  useFetcher,
  useNavigation,
  Outlet
} from '@remix-run/react'
import { useEffect, useState, type ReactElement } from 'react'
import {
  ConfirmModal,
  InfoModal,
  ScriptModal
} from '~/components/modals/index.js'
import {
  ErrorPanel,
  NotFoundConfig,
  PageHeader,
  ToolConfig,
  ToolPreview,
  type SelectOption
} from '~/components/index.js'
import { validConfigTypes, type ModalType } from '~/lib/presets.js'
import { tooltips } from '~/lib/tooltips.js'
import type { ElementConfigType } from '@shared/types'
import { getDefaultData } from '@shared/default-data'
import { capitalizeFirstLetter } from '~/lib/utils.js'
import { commitSession, getSession } from '~/utils/session.server.js'

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const { env } = context.cloudflare
  const elementType = params.type

  const session = await getSession(request.headers.get('Cookie'))
  const walletAddress = session.get('wallet-address')
  const lastAction = session.get('last-action')
  const grantResponse = session.get('grant-response')
  const isGrantAccepted = session.get('is-grant-accepted')
  const isGrantResponse = session.get('is-grant-response')

  // removed unneeded data
  session.unset('grant-response')
  session.unset('is-grant-accepted')
  session.unset('is-grant-response')

  const defaultConfig = getDefaultData()
  const scriptInitUrl = env.SCRIPT_EMBED_URL
  const apiUrl = env.API_URL
  const opWallet = env.OP_WALLET_ADDRESS

  return json(
    {
      elementType,
      defaultConfig,
      scriptInitUrl,
      apiUrl,
      opWallet,
      walletAddress,
      grantResponse,
      isGrantResponse,
      isGrantAccepted,
      lastAction
    },
    {
      headers: {
        'Set-Cookie': await commitSession(session)
      }
    }
  )
}

export default function Create() {
  const {
    elementType,
    defaultConfig,
    scriptInitUrl,
    apiUrl,
    opWallet,
    walletAddress,
    isGrantAccepted,
    grantResponse,
    isGrantResponse
  } = useLoaderData<typeof loader>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  const saveFetcher = useFetcher()
  const [toolConfig, setToolConfig] = useState<ElementConfigType>(defaultConfig)
  const [fullConfig, setFullConfig] = useState<
    Record<string, ElementConfigType>
  >({
    default: defaultConfig
  })
  const [modal, setModal] = useState<ModalType | undefined>()
  const [selectedVersion, setSelectedVersion] = useState('default')
  const [versionOptions, setVersionOptions] = useState<SelectOption[]>([
    { label: 'Default', value: 'default' }
  ])

  const getScriptToDisplay = (): string | undefined => {
    if (!toolConfig?.walletAddress) {
      return undefined
    }

    const wa = toolConfig.walletAddress.replace('$', '').replace('https://', '')
    return `<script id="wmt-init-script" type="module" src="${scriptInitUrl}init.js?wa=${wa}&tag=[version]&types=[elements]"></script>`
  }

  const onSelectVersion = (selectedVersion: string) => {
    const config = fullConfig[selectedVersion]
    if (config) {
      setToolConfig(config)
      setSelectedVersion(selectedVersion)
      sessionStorage.setItem('new-version', selectedVersion)
    } else {
      throw new Error('Version not found')
    }
  }

  const onConfirmOwnership = (
    redirectIntent?: string,
    interactHref?: string
  ) => {
    if (!interactHref) {
      throw new Error('Grant not found')
    }
    if (redirectIntent) {
      sessionStorage.setItem('grant-redirect-intent', redirectIntent)
    }
    window.location.href = interactHref
  }

  /**
   * Update the config and version options based on the provided full config object and version name.
   * @param fullConfigObject
   * @param versionName
   */
  const setConfigs = (
    fullConfigObject: Record<string, ElementConfigType>,
    versionName: string
  ) => {
    if (fullConfigObject?.default) {
      const versionLabels = Object.keys(fullConfigObject).map((key) => {
        return {
          label: capitalizeFirstLetter(key.replaceAll('-', ' ')),
          value: key
        }
      })
      setVersionOptions(versionLabels)
      setFullConfig(fullConfigObject)
    }
    if (versionName) {
      setSelectedVersion(versionName)
      setToolConfig(fullConfigObject[versionName])
    } else {
      setToolConfig(fullConfigObject.default)
    }
  }

  const getConfirmModalContent = (modal: ModalType | undefined) => {
    let title: string | ReactElement = '',
      description = '',
      onConfirm = () => {}
    const onClose = () => setModal(undefined)

    switch (modal?.type) {
      case 'wallet-ownership':
        title = (
          <span>
            Please confirm you are owner of
            <span className="flex w-full justify-center text-center">
              {walletAddress?.id || ''}
            </span>
          </span>
        )
        description =
          "You will need to confirm a grant to prove that you are the owner of the wallet address. It's value is set to 1 but there will be no funds removed from your wallet"
        onConfirm = () =>
          onConfirmOwnership(
            modal?.grantRedirectIntent,
            modal?.grantRedirectURI
          )
        break
      case 'grant-response':
        title = grantResponse
        onConfirm = isGrantAccepted
          ? () => {
              onResubmitForm()
              setModal(undefined)
            }
          : onClose
        break
    }
    return { title, description, onClose, onConfirm }
  }

  useEffect(() => {
    const savedConfig = sessionStorage.getItem('fullconfig') || '{}'
    const savedSelectedVersion =
      sessionStorage.getItem('new-version') || 'default'

    try {
      const parsedConfig = JSON.parse(savedConfig)
      if (Object.keys(parsedConfig).length) {
        setConfigs(parsedConfig, savedSelectedVersion)

        setSelectedVersion(savedSelectedVersion)
        setToolConfig(
          parsedConfig[savedSelectedVersion] || parsedConfig.default
        )
      } else {
        setToolConfig(defaultConfig)
        setFullConfig({ default: defaultConfig })
      }
    } catch (error) {
      setToolConfig(defaultConfig)
      setFullConfig({ default: defaultConfig })
      throw new Error(
        `Error restoring saved configuration: ${(error as Error).message}`
      )
    }

    if (isGrantResponse) {
      setModal({ type: 'grant-response' })
    }
  }, [])

  useEffect(() => {
    // @ts-expect-error TODO
    const errors = Object.keys(saveFetcher?.data?.errors?.fieldErrors || {})
    if (!errors.length && saveFetcher.data && saveFetcher.state === 'idle') {
      const updatedFullConfig = {
        ...fullConfig,
        [selectedVersion]: toolConfig
      }

      // @ts-expect-error TODO
      if (saveFetcher.data?.grantRequired) {
        sessionStorage.setItem('fullconfig', JSON.stringify(updatedFullConfig))
        setModal({
          type: 'wallet-ownership',
          // @ts-expect-error TODO
          grantRedirectURI: saveFetcher.data?.grantRequired,
          // @ts-expect-error TODO
          grantRedirectIntent: saveFetcher.data?.intent
        })
      } else {
        // @ts-expect-error TODO
        setFullConfig(saveFetcher.data)
        sessionStorage.setItem('fullconfig', JSON.stringify(saveFetcher.data))
        setModal({ type: 'script' })
      }
    }
  }, [saveFetcher.data, saveFetcher.state])

  const onResubmitForm = () => {
    const intent = sessionStorage.getItem('grant-redirect-intent')
    if (intent !== 'update') {
      sessionStorage.removeItem('grant-redirect-intent')
      return
    }
    sessionStorage.removeItem('grant-redirect-intent')
    const formData = new FormData()
    formData.append('bannerFontName', toolConfig.bannerFontName)
    formData.append('bannerFontSize', toolConfig.bannerFontSize.toString())
    formData.append('bannerDescriptionText', toolConfig.bannerDescriptionText)
    formData.append('bannerTextColor', toolConfig.bannerTextColor)
    formData.append('bannerBackgroundColor', toolConfig.bannerBackgroundColor)
    formData.append('bannerSlideAnimation', toolConfig.bannerSlideAnimation)
    formData.append('bannerPosition', toolConfig.bannerPosition)
    formData.append('bannerBorder', toolConfig.bannerBorder)
    formData.append('walletAddress', toolConfig.walletAddress!)
    formData.append('version', selectedVersion)
    formData.append('fullconfig', JSON.stringify(fullConfig))
    formData.append('intent', 'update')

    saveFetcher.submit(formData, {
      method: 'put',
      action: `/api/config/${elementType}`
    })
  }

  return (
    <div className="flex flex-col gap-6 min-w-128 max-w-prose mx-auto my-8">
      <PageHeader
        title={`Create ${elementType}`}
        elementType={elementType}
        versionOptions={versionOptions}
        selectedVersion={selectedVersion}
        onsetSelectVersion={onSelectVersion}
      />
      {toolConfig && validConfigTypes.includes(String(elementType)) ? (
        <div className="flex flex-col">
          <saveFetcher.Form
            id="config-form"
            method="put"
            action={`/api/config/${elementType}`}
            onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const updatedFullConfig = {
                ...fullConfig,
                [selectedVersion]: toolConfig
              }

              formData.set('fullconfig', JSON.stringify(updatedFullConfig))
              formData.set('intent', 'update')
              saveFetcher.submit(formData, {
                method: 'put',
                action: `/api/config/${elementType}`
              })
            }}
          >
            <fieldset disabled={isSubmitting || saveFetcher.state !== 'idle'}>
              <ToolPreview
                type={elementType}
                apiUrl={apiUrl}
                opWallet={opWallet}
                toolConfig={toolConfig}
              />
              <ToolConfig
                type={elementType}
                toolConfig={toolConfig}
                defaultConfig={defaultConfig}
                setToolConfig={setToolConfig}
                isSubmiting={isSubmitting || saveFetcher.state !== 'idle'}
                // @ts-expect-error TODO
                errors={saveFetcher?.data?.errors}
              />
            </fieldset>
            <input
              type="hidden"
              name="fullconfig"
              value={JSON.stringify(fullConfig)}
            />
            <input
              type="hidden"
              name="version"
              value={selectedVersion || 'default'}
            />
            <div className="px-6 pt-5">
              {/* @ts-expect-error TODO */}
              <ErrorPanel errors={saveFetcher?.data?.errors?.message || []} />
            </div>
          </saveFetcher.Form>
        </div>
      ) : (
        <NotFoundConfig />
      )}

      <ScriptModal
        title="Your script"
        selectedVersion={selectedVersion}
        tooltip={tooltips.scriptModal}
        defaultType={elementType}
        scriptForDisplay={getScriptToDisplay()}
        isOpen={modal?.type === 'script'}
        onClose={() => setModal(undefined)}
      />
      <Outlet
        context={{
          toolConfig,
          setConfigs,
          setToolConfig,
          setModalOpen: setModal,
          selectedVersion
        }}
      />
      <InfoModal
        title="Available configs"
        content={versionOptions.map((ver) => ver.value).join(', ')}
        isOpen={modal?.type === 'info'}
        onClose={() => setModal(undefined)}
      />
      <ConfirmModal
        {...getConfirmModalContent(modal)}
        isOpen={['confirm', 'wallet-ownership', 'grant-response'].includes(
          modal?.type || ''
        )}
      />
    </div>
  )
}
