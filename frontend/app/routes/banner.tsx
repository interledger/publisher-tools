import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useImperativeHandle
} from 'react'
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
  BannerPositionSelector,
  BannerColorsSelector
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
import type { BannerConfig, Banner as BannerComponent } from '@tools/components'
import type { ToolContent } from '~/components/redesign/components/ContentBuilder'
import type { BannerToolAppearance } from '~/components/redesign/components/AppearanceBuilder'
import { BANNER_FONT_SIZES } from '@shared/types'
import type {
  BannerPositionKey,
  CornerType,
  FontFamilyKey,
  SlideAnimationType
} from '@shared/types'

export const meta: MetaFunction = () => {
  return [
    { title: 'Banner - Web Monetization Tools' },
    {
      name: 'description',
      content:
        'Create and customize a Web Monetization banner for your website. The banner informs visitors about Web Monetization and provides a call-to-action for extension installation.'
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

interface BannerHandle {
  triggerPreview: () => void
}

const BannerPreview = React.forwardRef<BannerHandle>((props, ref) => {
  const snap = useSnapshot(toolState)
  const [isLoaded, setIsLoaded] = useState(false)
  const bannerContainerRef = useRef<HTMLDivElement>(null)
  const bannerElementRef = useRef<BannerComponent | null>(null)

  useImperativeHandle(ref, () => ({
    triggerPreview: () => {
      if (bannerElementRef.current) {
        bannerElementRef.current.previewAnimation()
      }
    }
  }))

  useEffect(() => {
    const loadBannerComponent = async () => {
      if (!customElements.get('wm-banner')) {
        // dynamic import - ensure component only runs on the client side and not on SSR
        const { Banner } = await import('@tools/components/banner')
        customElements.define('wm-banner', Banner)
      }
      setIsLoaded(true)
    }

    loadBannerComponent()
  }, [])

  const bannerConfig = useMemo(
    () =>
      ({
        cdnUrl: snap.cdnUrl,
        bannerTitleText: snap.currentConfig?.bannerTitleText,
        bannerDescriptionText: snap.currentConfig?.bannerDescriptionText,
        isBannerDescriptionVisible:
          snap.currentConfig?.bannerDescriptionVisible,
        bannerPosition: snap.currentConfig?.bannerPosition,
        bannerBorderRadius: snap.currentConfig?.bannerBorder,
        bannerSlideAnimation: snap.currentConfig?.bannerSlideAnimation,
        bannerThumbnail: snap.currentConfig?.bannerThumbnail,
        theme: {
          backgroundColor: snap.currentConfig?.bannerBackgroundColor,
          textColor: snap.currentConfig?.bannerTextColor,
          fontSize: snap.currentConfig?.bannerFontSize,
          fontFamily: snap.currentConfig?.bannerFontName
        }
      }) as BannerConfig,
    [snap.currentConfig]
  )

  useEffect(() => {
    if (bannerContainerRef.current && isLoaded) {
      if (bannerElementRef.current) {
        bannerElementRef.current.config = bannerConfig
        return
      }

      const bannerElement = document.createElement(
        'wm-banner'
      ) as BannerComponent
      bannerElement.config = bannerConfig
      bannerElementRef.current = bannerElement

      bannerContainerRef.current.appendChild(bannerElement)
    }
  }, [bannerConfig, isLoaded])

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  return (
    <div
      ref={bannerContainerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%'
      }}
    />
  )
})

BannerPreview.displayName = 'BannerPreview'

export default function Banner() {
  const snap = useSnapshot(toolState)
  const { actions: uiActions } = useUI()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingScript, setIsLoadingScript] = useState(false)
  const walletAddressRef = useRef<HTMLDivElement>(null)
  const bannerRef = useRef<BannerHandle>(null)
  const { grantResponse, isGrantAccepted, isGrantResponse, env } =
    useLoaderData<typeof loader>()
  usePathTracker()

  const contentConfiguration: ToolContent = {
    suggestedTitles: [
      'How to support?',
      'Fund me',
      'Pay as you browse',
      'Easy donate',
      'Support my work'
    ],
    titleHelpText: 'Strong message to help people engage with Web Monetization',
    titleMaxLength: 60,
    messageLabel: 'Banner message',
    messagePlaceholder: 'Enter your banner message...',
    messageHelpText:
      'Strong message to help people engage with Web Monetization',
    messageMaxLength: 300,
    currentTitle: snap.currentConfig?.bannerTitleText,
    currentMessage: snap.currentConfig?.bannerDescriptionText,
    isDescriptionVisible: snap.currentConfig?.bannerDescriptionVisible ?? true,
    onTitleChange: (title: string) =>
      toolActions.setToolConfig({ bannerTitleText: title }),
    onMessageChange: (message: string) =>
      toolActions.setToolConfig({ bannerDescriptionText: message }),
    onSuggestedTitleClick: (title: string) =>
      toolActions.setToolConfig({ bannerTitleText: title.replace(/"/g, '') }),
    onDescriptionVisibilityChange: (visible: boolean) =>
      toolActions.setToolConfig({
        bannerDescriptionVisible: visible
      })
  }

  const appearanceConfiguration: BannerToolAppearance = {
    fontName: snap.currentConfig?.bannerFontName,
    fontSize: snap.currentConfig?.bannerFontSize ?? BANNER_FONT_SIZES.default,
    fontSizeRange: BANNER_FONT_SIZES,
    backgroundColor: snap.currentConfig?.bannerBackgroundColor,
    textColor: snap.currentConfig?.bannerTextColor,
    borderRadius: snap.currentConfig?.bannerBorder,
    position: snap.currentConfig?.bannerPosition,
    slideAnimation: snap.currentConfig?.bannerSlideAnimation,
    thumbnail: snap.currentConfig?.bannerThumbnail ?? 'default',

    onFontNameChange: (fontName: FontFamilyKey) =>
      toolActions.setToolConfig({ bannerFontName: fontName }),
    onFontSizeChange: (fontSize: number) =>
      toolActions.setToolConfig({ bannerFontSize: fontSize }),
    onBackgroundColorChange: (color: string) =>
      toolActions.setToolConfig({ bannerBackgroundColor: color }),
    onTextColorChange: (color: string) =>
      toolActions.setToolConfig({ bannerTextColor: color }),
    onBorderChange: (border: CornerType) =>
      toolActions.setToolConfig({ bannerBorder: border }),
    onPositionChange: (position: BannerPositionKey) =>
      toolActions.setToolConfig({ bannerPosition: position }),
    onSlideAnimationChange: (animation: SlideAnimationType) =>
      toolActions.setToolConfig({ bannerSlideAnimation: animation }),
    onThumbnailVisibilityChange: (visible: boolean) => {
      toolActions.setToolConfig({ bannerThumbnail: visible ? 'default' : '' })
    },

    showAnimation: true
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

  const handlePreviewClick = () => {
    if (bannerRef.current) {
      bannerRef.current.triggerPreview()
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
          <HeadingCore title="Banner" onBackClick={() => navigate('/')}>
            The drawer banner informs visitors who don&apos;t have the Web
            Monetization extension active, with a call-to-action linking to the
            extension or providing details about the options available.
            <br />
            It also adds your wallet address for your site to be monetized.
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
                      toolName="banner"
                      content={contentConfiguration}
                      appearance={appearanceConfiguration}
                      onBuildStepComplete={(isComplete) =>
                        toolActions.setBuildCompleteStep(
                          isComplete ? 'filled' : 'unfilled'
                        )
                      }
                      onRefresh={handleRefresh}
                      positionSelector={
                        <BannerPositionSelector
                          defaultValue={snap.currentConfig?.bannerPosition}
                          onChange={(value) =>
                            toolActions.setToolConfig({ bannerPosition: value })
                          }
                        />
                      }
                      colorsSelector={
                        <BannerColorsSelector
                          backgroundColor={
                            snap.currentConfig?.bannerBackgroundColor
                          }
                          textColor={snap.currentConfig?.bannerTextColor}
                          onBackgroundColorChange={(color: string) =>
                            toolActions.setToolConfig({
                              bannerBackgroundColor: color
                            })
                          }
                          onTextColorChange={(color: string) =>
                            toolActions.setToolConfig({
                              bannerTextColor: color
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
                    <BuilderBackground onPreviewClick={handlePreviewClick}>
                      <BannerPreview ref={bannerRef} />
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
