import { useEffect, useState, useRef } from 'react'
import {
  useLoaderData,
  useNavigate,
  data,
  type LoaderFunctionArgs,
  type MetaFunction
} from 'react-router'
import { useSnapshot } from 'valtio'
import { SVGSpinner } from '@/assets'
import {
  HeadingCore,
  ToolsWalletAddress,
  BuilderBackground,
  ToolsSecondaryButton,
  ToolsPrimaryButton,
  StepsIndicator,
  MobileStepsIndicator,
  WalletOwnershipModal,
  StatusModal,
  ScriptReadyModal
} from '@/components'
import { BuilderTabs } from '~/components/builder/BuilderTabs'
import { WidgetBuilder } from '~/components/widget/WidgetBuilder'
import { WidgetPreview } from '~/components/widget/WidgetPreview'
import { useBodyClass } from '~/hooks/useBodyClass'
import { useDialog } from '~/hooks/useDialog'
import { usePathTracker } from '~/hooks/usePathTracker'
import {
  toolState,
  toolActions,
  persistState,
  loadState
} from '~/stores/toolStore'
import { commitSession, getSession } from '~/utils/session.server.js'
import { legacySplitConfigProperties as splitConfigProperties } from '~/utils/utils.storage'

export const meta: MetaFunction = () => {
  return [
    { title: 'Widget - Publisher Tools' },
    {
      name: 'description',
      content:
        'Create and customize a Web Monetization payment widget for your website. The widget allows visitors to make one-time payments to support your content.'
    }
  ]
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { env } = context.cloudflare
  const session = await getSession(request.headers.get('Cookie'))
  const grantResponse = session.get('grant-response')
  const isGrantAccepted = session.get('is-grant-accepted')
  const isGrantResponse = session.get('is-grant-response')

  session.unset('grant-response')
  session.unset('is-grant-accepted')
  session.unset('is-grant-response')

  return data(
    {
      grantResponse,
      isGrantAccepted,
      isGrantResponse,
      OP_WALLET_ADDRESS: env.OP_WALLET_ADDRESS
    },
    {
      headers: {
        'Set-Cookie': await commitSession(session)
      }
    }
  )
}

export default function Widget() {
  const snap = useSnapshot(toolState)
  const navigate = useNavigate()
  const [openDialog, closeDialog] = useDialog()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingScript, setIsLoadingScript] = useState(false)
  const walletAddressRef = useRef<HTMLDivElement>(null)
  const { grantResponse, isGrantAccepted, isGrantResponse, OP_WALLET_ADDRESS } =
    useLoaderData<typeof loader>()
  usePathTracker()

  useBodyClass('has-fixed-action-bar')

  useEffect(() => {
    const initializeState = async () => {
      loadState(OP_WALLET_ADDRESS)
      persistState()
      if (isGrantResponse) {
        toolActions.setGrantResponse(grantResponse, isGrantAccepted)
        if (toolState.isGrantAccepted) {
          await toolActions.saveConfig(toolState.lastSaveAction)
          if (toolState.lastSaveAction === 'save-success') {
            openDialog(<StatusModal onDone={closeDialog} />)
          } else {
            openDialog(<ScriptReadyModal />)
          }
        } else {
          openDialog(
            <StatusModal
              onDone={closeDialog}
              message="Grant was not accepted"
              status="error"
            />
          )
        }
      }
    }

    initializeState()
  }, [grantResponse, isGrantAccepted, isGrantResponse])

  const scrollToWalletAddress = () => {
    if (!walletAddressRef.current) {
      return
    }
    walletAddressRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    })

    walletAddressRef.current.style.transition = 'all 0.3s ease'
    walletAddressRef.current.style.transform = 'scale(1.02)'

    setTimeout(() => {
      if (walletAddressRef.current) {
        walletAddressRef.current.style.transform = 'scale(1)'
      }
    }, 500)
  }

  const handleSave = async (action: 'save-success' | 'script') => {
    if (!snap.isWalletConnected) {
      toolActions.setConnectWalletStep('error')
      scrollToWalletAddress()
      return
    }

    const isScript = action === 'script'
    const setLoading = isScript ? setIsLoadingScript : setIsLoading

    setLoading(true)
    try {
      const response = await toolActions.saveConfig(action)
      if (!response.success && response.data?.grantRequired) {
        openDialog(
          <WalletOwnershipModal grantRedirect={response.data.grantRequired} />
        )

        return
      }

      if (action === 'save-success') {
        openDialog(<StatusModal onDone={closeDialog} />)
      } else {
        openDialog(<ScriptReadyModal />)
      }
    } catch (err) {
      const error = err as Error
      console.error({ error })
      const message = error.message
      // @ts-expect-error TODO
      const fieldErrors = error.cause?.details?.errors?.fieldErrors
      openDialog(
        <StatusModal
          onDone={closeDialog}
          fieldErrors={fieldErrors}
          message={message}
        />
      )
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = (section: 'content' | 'appearance') => {
    const savedConfig = snap.savedConfigurations[toolState.activeVersion]
    const { content, appearance } = splitConfigProperties(savedConfig)
    Object.assign(
      toolState.currentConfig,
      section === 'content' ? content : appearance
    )
  }
  return (
    <div className="bg-interface-bg-main w-full">
      <div className="flex flex-col items-center pt-[60px] md:pt-3xl">
        <div className="w-full max-w-[1280px] px-md">
          <HeadingCore title="Widget" onBackClick={() => navigate('/')}>
            The payment widget allows visitors to make one-time payments to
            support your content directly. It provides a clean, customizable
            interface for Web Monetization payments.
            <br />
            Configure your wallet address to receive payments from your
            supporters.
          </HeadingCore>
          <div className="flex flex-col min-h-[756px]">
            <div className="flex flex-col xl:flex-row xl:items-start gap-lg">
              <div
                id="steps-indicator"
                className="hidden xl:block w-[60px] flex-shrink-0 pt-md"
              >
                <StepsIndicator
                  steps={[
                    {
                      number: 1,
                      label: 'Connect',
                      status: snap.walletConnectStep
                    },
                    {
                      number: 2,
                      label: 'Build',
                      status: snap.buildStep
                    }
                  ]}
                />
              </div>

              <div className="flex flex-col gap-2xl xl:gap-12 flex-1">
                <div id="wallet-address" ref={walletAddressRef}>
                  <MobileStepsIndicator
                    number={1}
                    label="Connect"
                    status={snap.walletConnectStep}
                  />
                  <ToolsWalletAddress toolName="payment widget" />
                </div>

                <div className="flex flex-col xl:flex-row gap-2xl">
                  <div
                    id="builder"
                    className="w-full xl:max-w-[628px] xl:flex-1"
                  >
                    <MobileStepsIndicator
                      number={2}
                      label="Build"
                      status={snap.buildStep}
                    />
                    <BuilderTabs>
                      <WidgetBuilder onRefresh={handleRefresh} />
                    </BuilderTabs>

                    <div
                      id="builder-actions"
                      className="xl:flex xl:items-center xl:justify-end xl:gap-sm xl:mt-lg xl:static xl:bg-transparent xl:p-0 xl:border-0 xl:backdrop-blur-none xl:flex-row
                                 fixed bottom-0 left-0 right-0 flex flex-col gap-xs px-md sm:px-lg md:px-xl py-md bg-interface-bg-stickymenu/95 backdrop-blur-[20px] border-t border-field-border z-40"
                    >
                      <div
                        id="builder-actions-inner"
                        className="xl:contents flex flex-col gap-xs mx-auto w-full xl:w-auto xl:p-0 xl:mx-0 xl:flex-row xl:gap-sm"
                      >
                        <ToolsSecondaryButton
                          className="xl:w-[150px] xl:rounded-lg
                                     w-full min-w-0 border-0 xl:border order-last xl:order-first"
                          disabled={isLoading}
                          onClick={() => handleSave('save-success')}
                        >
                          <div className="flex items-center justify-center gap-2">
                            {isLoading && <SVGSpinner className="w-4 h-4" />}
                            <span>
                              {isLoading ? 'Saving...' : 'Save edits only'}
                            </span>
                          </div>
                        </ToolsSecondaryButton>
                        <ToolsPrimaryButton
                          icon="script"
                          iconPosition={isLoadingScript ? 'none' : 'left'}
                          className="xl:w-[250px] xl:rounded-lg
                                     w-full min-w-0 order-first xl:order-last"
                          disabled={isLoadingScript}
                          onClick={() => handleSave('script')}
                        >
                          <div className="flex items-center justify-center gap-xs">
                            {isLoadingScript && (
                              <SVGSpinner className="w-4 h-4" />
                            )}
                            <span>
                              {isLoadingScript
                                ? 'Saving...'
                                : 'Save and generate script'}
                            </span>
                          </div>
                        </ToolsPrimaryButton>
                      </div>
                    </div>
                  </div>

                  <div
                    id="preview"
                    className="w-full mx-auto xl:mx-0 xl:sticky xl:top-md xl:self-start xl:flex-shrink-0 xl:w-[504px] h-fit"
                  >
                    <BuilderBackground>
                      <WidgetPreview
                        serviceUrls={{ cdn: snap.cdnUrl, api: snap.apiUrl }}
                        opWallet={snap.opWallet}
                      />
                    </BuilderBackground>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
