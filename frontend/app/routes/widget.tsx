import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useSnapshot } from 'valtio'
import { useLoaderData, useNavigate } from '@remix-run/react'
import { useUI } from '~/stores/uiStore'
import { usePathTracker } from '~/hooks/usePathTracker'
import {
  type LoaderFunctionArgs,
  json,
  type MetaFunction
} from '@remix-run/cloudflare'
import {
  HeadingCore,
  ToolsWalletAddress,
  BuilderForm,
  BuilderBackground,
  ToolsSecondaryButton,
  ToolsPrimaryButton,
  SaveResultModal,
  ScriptReadyModal,
  WalletOwnershipModal,
  OverridePresetModal,
  StepsIndicator,
  MobileStepsIndicator,
  WidgetPositionSelector,
  WidgetColorsSelector
} from '@/components'
import type {
  SlideAnimationType,
  FontFamilyKey,
  CornerType
} from '@shared/types'

import { commitSession, getSession } from '~/utils/session.server.js'
import { useBodyClass } from '~/hooks/useBodyClass'
import { SVGSpinner } from '@/assets'
import type {
  WidgetConfig,
  PaymentWidget as WidgetComponent
} from '@tools/components'
import type { ToolContent } from '~/components/redesign/components/ContentBuilder'
import type { WidgetToolAppearance } from '~/components/redesign/components/AppearanceBuilder'
import { WIDGET_FONT_SIZES } from '@shared/types'
import {
  toolActions,
  toolState,
  loadState,
  persistState,
  splitConfigProperties
} from '~/stores/toolStore'

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

  return json(
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

const WidgetPreview: React.FC = () => {
  const snap = useSnapshot(toolState)
  const config = snap.getWidgetStore(snap.activeVersion).configuration
  const [isLoaded, setIsLoaded] = useState(false)
  const widgetRef = useRef<WidgetComponent>(null)

  useEffect(() => {
    const loadWidgetComponent = async () => {
      try {
        if (customElements.get('wm-payment-widget')) {
          setIsLoaded(true)
          return
        }

        // dynamic import - ensure component only runs on the client side and not on SSR
        const { PaymentWidget } = await import('@tools/components')
        customElements.define('wm-payment-widget', PaymentWidget)
        setIsLoaded(true)
      } catch (error) {
        console.error('Failed to load widget component:', error)
      }
    }

    loadWidgetComponent()
  }, [])

  const widgetConfig = useMemo(
    () =>
      ({
        apiUrl: snap.apiUrl,
        receiverAddress: snap.opWallet,
        action: config.widgetButtonText,
        widgetTitleText: config.widgetTitleText,
        widgetDescriptionText: config.widgetDescriptionText,
        isWidgetDescriptionVisible: config.widgetDescriptionVisible,
        widgetTriggerIcon: config.widgetTriggerIcon,
        widgetPosition: config.widgetPosition,
        theme: {
          primaryColor: config.widgetButtonBackgroundColor,
          backgroundColor: config.widgetBackgroundColor,
          textColor: config.widgetTextColor,
          fontSize: config.widgetFontSize,
          fontFamily: config.widgetFontName,
          widgetBorderRadius: config.widgetButtonBorder,
          widgetButtonBackgroundColor: config.widgetTriggerBackgroundColor
        }
      }) as WidgetConfig,
    [config]
  )

  useEffect(() => {
    if (widgetRef.current && isLoaded) {
      const widget = widgetRef.current
      widget.config = widgetConfig
      widget.isPreview = true
    }
  }, [widgetConfig, isLoaded])

  if (!isLoaded) {
    return <div>Loading widget...</div>
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end'
      }}
    >
      <wm-payment-widget ref={widgetRef} />
    </div>
  )
}

export default function Widget() {
  const snap = useSnapshot(toolState)
  const { configuration } = snap.getWidgetStore(snap.activeVersion)

  const { actions: uiActions } = useUI()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingScript, setIsLoadingScript] = useState(false)
  const walletAddressRef = useRef<HTMLDivElement>(null)
  const { grantResponse, isGrantAccepted, isGrantResponse, OP_WALLET_ADDRESS } =
    useLoaderData<typeof loader>()
  usePathTracker()

  const contentConfiguration: ToolContent = {
    suggestedTitles: [
      'Support this content',
      'Make a payment',
      'Contribute now',
      'Help support',
      'One-time donation'
    ],
    titleHelpText: 'Message to encourage one-time payments',
    titleMaxLength: 30,
    messageLabel: 'Widget message',
    messagePlaceholder: 'Enter your widget message...',
    messageHelpText: 'Describe how payments support your work',
    messageMaxLength: 300,
    currentTitle: configuration.widgetTitleText,
    currentMessage: configuration.widgetDescriptionText,
    isDescriptionVisible: configuration.widgetDescriptionVisible ?? true,
    onTitleChange: (title: string) => {
      configuration.widgetTitleText = title
    },
    onMessageChange: (description: string) => {
      configuration.widgetDescriptionText = description
    },
    onSuggestedTitleClick: (title: string) => {
      configuration.widgetTitleText = title.replace(/"/g, '')
    },
    onDescriptionVisibilityChange: (visible: boolean) => {
      configuration.widgetDescriptionVisible = visible
    }
  }

  const appearanceConfiguration: WidgetToolAppearance = {
    fontName: configuration.widgetFontName,
    fontSize: configuration.widgetFontSize ?? WIDGET_FONT_SIZES.default,
    fontSizeRange: WIDGET_FONT_SIZES,
    backgroundColor: configuration.widgetBackgroundColor,
    textColor: configuration.widgetTextColor,
    buttonColor: configuration.widgetButtonBackgroundColor,
    borderRadius: configuration.widgetButtonBorder,
    position: configuration.widgetPosition,
    slideAnimation: undefined,
    thumbnail: configuration.widgetTriggerIcon,

    onFontNameChange: (fontName: FontFamilyKey) => {
      configuration.widgetFontName = fontName
    },
    onFontSizeChange: (fontSize: number) => {
      configuration.widgetFontSize = fontSize
    },
    onBorderChange: (border: CornerType) => {
      configuration.widgetButtonBorder = border
    },
    onSlideAnimationChange: (_animation: SlideAnimationType) => {},
    onThumbnailVisibilityChange: (visible: boolean) => {
      configuration.widgetTriggerIcon = visible ? 'default' : ''
    },

    showAnimation: false
  }

  useBodyClass('has-fixed-action-bar')

  useEffect(() => {
    loadState(OP_WALLET_ADDRESS)
    persistState()

    if (isGrantResponse) {
      toolActions.setGrantResponse(grantResponse, isGrantAccepted)
      toolActions.handleGrantResponse()
    }
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
      await toolActions.saveConfig(action)
    } catch (err) {
      const error = err as Error
      console.error({ error })
      const message = error.message
      // @ts-expect-error TODO
      const fieldErrors = error.cause?.details?.errors?.fieldErrors
      toolActions.setModal({
        type: 'save-error',
        error: { message, fieldErrors }
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmWalletOwnership = () => {
    if (snap.modal?.grantRedirectURI) {
      toolActions.confirmWalletOwnership(snap.modal.grantRedirectURI)
    }
  }

  const handleCloseModal = () => {
    toolActions.setModal(undefined)
  }

  const handleRefresh = (section: 'content' | 'appearance') => {
    const savedConfig = toolState.savedConfigurations[toolState.activeVersion]
    if (!savedConfig) return

    const { content, appearance } = splitConfigProperties(savedConfig)
    toolActions.setToolConfig(section === 'content' ? content : appearance)
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
                  <ToolsWalletAddress />
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
                    <BuilderForm
                      toolName="widget"
                      content={contentConfiguration}
                      appearance={appearanceConfiguration}
                      onBuildStepComplete={(isComplete) =>
                        toolActions.setBuildCompleteStep(
                          isComplete ? 'filled' : 'unfilled'
                        )
                      }
                      onRefresh={handleRefresh}
                      positionSelector={
                        <WidgetPositionSelector
                          defaultValue={configuration.widgetPosition}
                          onChange={(value) =>
                            (configuration.widgetPosition = value)
                          }
                        />
                      }
                      colorsSelector={
                        <WidgetColorsSelector
                          backgroundColor={configuration.widgetBackgroundColor}
                          textColor={configuration.widgetTextColor}
                          buttonColor={
                            configuration.widgetButtonBackgroundColor
                          }
                          onBackgroundColorChange={(color: string) =>
                            (configuration.widgetBackgroundColor = color)
                          }
                          onTextColorChange={(color: string) =>
                            (configuration.widgetTextColor = color)
                          }
                          onButtonColorChange={(color: string) =>
                            (configuration.widgetButtonBackgroundColor = color)
                          }
                        />
                      }
                    />
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
                      <WidgetPreview />
                    </BuilderBackground>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {snap.modal?.type === 'script' && (
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity z-50">
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <ScriptReadyModal
                isOpen={true}
                onClose={handleCloseModal}
                scriptContent={toolActions.getScriptToDisplay()}
              />
            </div>
          </div>
        </div>
      )}

      {snap.modal?.type === 'save-success' && (
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity z-50">
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <SaveResultModal
                isOpen={true}
                onClose={handleCloseModal}
                onDone={handleCloseModal}
                message="Your edits have been saved"
                isSuccess={true}
              />
            </div>
          </div>
        </div>
      )}

      {snap.modal?.type === 'save-error' && (
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity z-50">
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <SaveResultModal
                isOpen={true}
                onClose={handleCloseModal}
                onDone={handleCloseModal}
                fieldErrors={snap.modal?.error?.fieldErrors}
                message={
                  snap.modal?.error?.message ||
                  (!snap.isGrantAccepted
                    ? String(snap.grantResponse)
                    : 'Error saving your edits')
                }
                isSuccess={!snap.modal.error && snap.isGrantAccepted}
              />
            </div>
          </div>
        </div>
      )}

      {snap.modal?.type === 'wallet-ownership' && (
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity z-50">
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <WalletOwnershipModal
                isOpen={true}
                onClose={handleCloseModal}
                onConfirm={handleConfirmWalletOwnership}
                walletAddress={snap.walletAddress}
              />
            </div>
          </div>
        </div>
      )}

      {snap.modal?.type === 'override-preset' && (
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity z-50">
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <OverridePresetModal
                onClose={handleCloseModal}
                onOverride={async (_selectedLocalConfigs) => {
                  await toolActions.overrideWithFetchedConfigs(
                    _selectedLocalConfigs
                  )
                  await toolActions.saveConfig('save-success')
                }}
                onAddWalletAddress={() => {
                  toolActions.resetWalletConnection()
                  uiActions.focusWalletInput()
                }}
                fetchedConfigs={snap.modal?.fetchedConfigs}
                currentLocalConfigs={snap.modal?.currentLocalConfigs}
                modifiedVersions={snap.modal?.modifiedConfigs || []}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
