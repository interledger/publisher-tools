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
import {
  toolState,
  toolActions,
  persistState,
  loadState,
  splitConfigProperties
} from '~/stores/toolStore'

import { commitSession, getSession } from '~/utils/session.server.js'
import { useBodyClass } from '~/hooks/useBodyClass'
import { SVGSpinner } from '@/assets'
import type {
  WidgetConfig,
  PaymentWidget as WidgetComponent
} from '@tools/components'
import type { ToolContent } from '~/components/redesign/components/ContentBuilder'
import type { WidgetToolAppearance } from '~/components/redesign/components/AppearanceBuilder'
import type {
  CornerType,
  FontFamilyKey,
  SlideAnimationType,
  WidgetPositionKey
} from '@shared/types'

export const meta: MetaFunction = () => {
  return [
    { title: 'Widget - Web Monetization Tools' },
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
      env
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
        action: snap.currentConfig.widgetButtonText,
        widgetTitleText: snap.currentConfig.widgetTitleText,
        widgetDescriptionText: snap.currentConfig.widgetDescriptionText,
        widgetTriggerIcon: snap.currentConfig.widgetTriggerIcon,
        widgetPosition: snap.currentConfig.widgetPosition,
        theme: {
          primaryColor: snap.currentConfig.widgetButtonBackgroundColor,
          backgroundColor: snap.currentConfig.widgetBackgroundColor,
          textColor: snap.currentConfig.widgetTextColor,
          fontSize: snap.currentConfig.widgetFontSize,
          fontFamily: snap.currentConfig.widgetFontName,
          widgetBorderRadius: snap.currentConfig.widgetButtonBorder,
          widgetButtonBackgroundColor:
            snap.currentConfig.widgetTriggerBackgroundColor
        }
      }) as WidgetConfig,
    [snap.currentConfig]
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
  const { actions: uiActions } = useUI()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingScript, setIsLoadingScript] = useState(false)
  const walletAddressRef = useRef<HTMLDivElement>(null)
  const { grantResponse, isGrantAccepted, isGrantResponse, env } =
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
    currentTitle: snap.currentConfig?.widgetTitleText,
    currentMessage: snap.currentConfig?.widgetDescriptionText,
    onTitleChange: (title: string) =>
      toolActions.setToolConfig({ widgetTitleText: title }),
    onMessageChange: (message: string) =>
      toolActions.setToolConfig({ widgetDescriptionText: message }),
    onSuggestedTitleClick: (title: string) =>
      toolActions.setToolConfig({ widgetTitleText: title.replace(/"/g, '') })
  }

  const appearanceConfiguration: WidgetToolAppearance = {
    fontName: snap.currentConfig?.widgetFontName,
    fontSize: snap.currentConfig?.widgetFontSize || 16,
    backgroundColor: snap.currentConfig?.widgetBackgroundColor,
    textColor: snap.currentConfig?.widgetTextColor,
    buttonColor: snap.currentConfig?.widgetButtonBackgroundColor,
    borderRadius: snap.currentConfig?.widgetButtonBorder,
    position: snap.currentConfig?.widgetPosition,
    slideAnimation: undefined,

    onFontNameChange: (fontName: FontFamilyKey) =>
      toolActions.setToolConfig({ widgetFontName: fontName }),
    onFontSizeChange: (fontSize: number) =>
      toolActions.setToolConfig({ widgetFontSize: fontSize }),
    onBackgroundColorChange: (color: string) =>
      toolActions.setToolConfig({ widgetBackgroundColor: color }),
    onTextColorChange: (color: string) =>
      toolActions.setToolConfig({ widgetTextColor: color }),
    onButtonColorChange: (color: string) =>
      toolActions.setToolConfig({ widgetButtonBackgroundColor: color }),
    onBorderChange: (border: CornerType) =>
      toolActions.setToolConfig({ widgetButtonBorder: border }),
    onPositionChange: (position: WidgetPositionKey) =>
      toolActions.setToolConfig({ widgetPosition: position }),
    onSlideAnimationChange: (_animation: SlideAnimationType) => {},

    showAnimation: false
  }

  useBodyClass('has-fixed-action-bar')

  useEffect(() => {
    loadState(env)
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
    await toolActions.saveConfig(action)
    setLoading(false)
  }

  const handleConfirmWalletOwnership = () => {
    if (snap.modal?.grantRedirectURI) {
      toolActions.confirmWalletOwnership(snap.modal.grantRedirectURI)
    }
  }

  const handleCloseModal = () => {
    toolActions.setModal(undefined)
  }

  const handleRefresh = () => {
    const savedConfig = toolState.savedConfigurations[toolState.activeVersion]
    if (!savedConfig) return

    const { content, appearance } = splitConfigProperties(savedConfig)

    toolActions.setToolConfig({
      ...content,
      ...appearance
    })
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
                          defaultValue={snap.currentConfig?.widgetPosition}
                          onChange={(value) =>
                            toolActions.setToolConfig({ widgetPosition: value })
                          }
                        />
                      }
                      colorsSelector={
                        <WidgetColorsSelector
                          backgroundColor={
                            snap.currentConfig?.widgetBackgroundColor
                          }
                          textColor={snap.currentConfig?.widgetTextColor}
                          buttonColor={
                            snap.currentConfig?.widgetButtonBackgroundColor
                          }
                          onBackgroundColorChange={(color: string) =>
                            toolActions.setToolConfig({
                              widgetBackgroundColor: color
                            })
                          }
                          onTextColorChange={(color: string) =>
                            toolActions.setToolConfig({
                              widgetTextColor: color
                            })
                          }
                          onButtonColorChange={(color: string) =>
                            toolActions.setToolConfig({
                              widgetButtonBackgroundColor: color
                            })
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
                message={
                  !snap.isGrantAccepted
                    ? String(snap.grantResponse)
                    : 'Error saving your edits'
                }
                isSuccess={snap.isGrantAccepted}
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
                onOverride={async (selectedLocalConfigs) => {
                  toolActions.overrideWithFetchedConfigs(selectedLocalConfigs)
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
