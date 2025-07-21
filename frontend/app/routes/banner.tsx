import React, { useEffect, useState, useRef } from 'react'
import { useSnapshot } from 'valtio'
import { useLoaderData, useNavigate } from '@remix-run/react'
import { type LoaderFunctionArgs, json } from '@remix-run/cloudflare'
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
  MobileStepsIndicator
} from '@/components'
import {
  toolState,
  toolActions,
  persistState,
  loadState
} from '~/stores/toolStore'
import { commitSession, getSession } from '~/utils/session.server.js'
import { SVGSpinner } from '@/assets'

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

export default function Redesign() {
  const snap = useSnapshot(toolState)
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingScript, setIsLoadingScript] = useState(false)
  const walletAddressRef = useRef<HTMLDivElement>(null)
  const { grantResponse, isGrantAccepted, isGrantResponse, env } =
    useLoaderData<typeof loader>()

  useEffect(() => {
    loadState(env)
    persistState()

    if (isGrantResponse) {
      toolActions.setGrantResponse(grantResponse, isGrantAccepted)
      toolActions.handleGrantResponse()
    }
  }, [grantResponse, isGrantAccepted, isGrantResponse])

  const scrollToWalletAddress = () => {
    if (walletAddressRef.current) {
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
  }

  const handleSaveEditsOnly = async () => {
    if (!snap.isWalletConnected) {
      toolActions.setConnectWalletStep('error')
      scrollToWalletAddress()
      return
    }

    setIsLoading(true)
    await toolActions.saveConfig('banner', 'save-success')
    setIsLoading(false)
  }

  const handleSaveAndGenerateScript = async () => {
    if (!snap.isWalletConnected) {
      toolActions.setConnectWalletStep('error')
      scrollToWalletAddress()
      return
    }

    setIsLoadingScript(true)
    await toolActions.saveConfig('banner', 'script')
    setIsLoadingScript(false)
  }

  const handleConfirmWalletOwnership = () => {
    if (snap.modal?.grantRedirectURI) {
      toolActions.confirmWalletOwnership(snap.modal.grantRedirectURI)
    }
  }

  const handleCloseModal = () => {
    toolActions.setModal(undefined)
  }

  return (
    <div className="bg-interface-bg-main min-h-screen w-full pb-[32px]">
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
            <div className="flex flex-col xl:flex-row xl:items-start gap-lg mb-3xl">
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
                      onBuildStepComplete={(isComplete) =>
                        toolActions.setBuildCompleteStep(
                          isComplete ? 'filled' : 'unfilled'
                        )
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
                          className="xl:w-auto xl:rounded-lg
                                     w-full min-w-0 border-0 xl:border order-last xl:order-first"
                          disabled={isLoading}
                          onClick={handleSaveEditsOnly}
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
                          className="xl:w-auto xl:rounded-lg
                                     w-full min-w-0 order-first xl:order-last"
                          disabled={isLoadingScript}
                          onClick={handleSaveAndGenerateScript}
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
                    <BuilderBackground />
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
                onCopy={() => console.log('Script copied to clipboard')}
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
                  await toolActions.saveConfig('banner', 'save-success')
                }}
                onAddWalletAddress={() => {
                  toolActions.resetWalletConnection()
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
