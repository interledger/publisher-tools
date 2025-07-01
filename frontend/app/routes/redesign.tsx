import React, { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'
import { useLoaderData } from '@remix-run/react'
import { type LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { StepsIndicator } from '~/components/redesign/components/StepsIndicator'
import { ToolsWalletAddress } from '../components/redesign/components/ToolsWalletAddress'
import { HeadingCore } from '../components/redesign/components/HeadingCore'
import { BuilderForm } from '~/components/redesign/components/BuilderForm'
import { BuilderBackground } from '~/components/redesign/components/BuilderBackground'
import { ToolsSecondaryButton } from '~/components/redesign/components/ToolsSecondaryButton'
import { ToolsPrimaryButton } from '~/components/redesign/components/ToolsPrimaryButton'
import { SaveResultModal } from '~/components/redesign/components/SaveResultModal'
import { WalletOwnershipModal } from '~/components/redesign/components/WalletOwnershipModal'
import {
  toolState,
  toolActions,
  persistState,
  loadState
} from '~/stores/toolStore'
import { commitSession, getSession } from '~/utils/session.server.js'
import { SVGSpinner } from '~/assets/svg'

export async function loader({ request }: LoaderFunctionArgs) {
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
      isGrantResponse
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
  const [isLoading, setIsLoading] = useState(false)
  const { grantResponse, isGrantAccepted, isGrantResponse } =
    useLoaderData<typeof loader>()

  useEffect(() => {
    loadState()
    persistState()

    if (isGrantResponse) {
      toolActions.setGrantResponse(grantResponse, isGrantAccepted)
      toolActions.handleGrantResponse()
    }
  }, [grantResponse, isGrantAccepted, isGrantResponse])

  const handleSaveEditsOnly = async () => {
    setIsLoading(true)
    await toolActions.saveConfig('banner')
    setIsLoading(false)
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
    <div className="bg-interface-bg-main min-h-screen w-full">
      {/* Main Content Container */}
      <div className="flex flex-col items-center min-h-[calc(100vh-64px)]">
        <div className="w-full max-w-[1280px] pt-[60px] pb-8 px-4">
          {/* Page Header */}
          <HeadingCore
            title="Banner"
            onBackClick={() => console.log('Back clicked')}
            className="mb-12"
          />
          {/* Description */}
          <div className="text-center max-w-[1280px] mx-auto mb-12">
            <p className="text-base leading-md text-text-primary">
              The drawer banner informs visitors who don&apos;t have the Web
              Monetization extension active, with a call-to-action linking to
              the extension or providing details about the options available.
              <br />
              It also adds your wallet address for your site to be monetized.
            </p>
          </div>
          {/* Main Content Section */}
          <div className="flex flex-col min-h-[756px]">
            {/* Wallet Address */}
            <div className="flex items-start gap-6 mb-12">
              <div className="w-[60px] flex-shrink-0 pt-4">
                <StepsIndicator
                  steps={[
                    {
                      number: 1,
                      label: 'Connect',
                      status: snap.isWalletConnected ? 'filled' : 'unfilled'
                    },
                    {
                      number: 2,
                      label: 'Build',
                      status: snap.isBuildStepComplete ? 'filled' : 'unfilled'
                    }
                  ]}
                />
              </div>

              <div className="flex flex-col gap-12 flex-1">
                <ToolsWalletAddress />

                {/* Build Content */}
                <div className="flex gap-8">
                  {/* Builder Form */}
                  <div className="max-w-[628px] flex-1">
                    <BuilderForm />

                    <div className="flex items-center justify-end gap-3 mt-6">
                      <ToolsSecondaryButton
                        className="w-[135px]"
                        disabled={isLoading}
                        onClick={handleSaveEditsOnly}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {isLoading && <SVGSpinner />}
                          <span>
                            {isLoading ? 'Saving...' : 'Save edits only'}
                          </span>
                        </div>
                      </ToolsSecondaryButton>
                      <ToolsPrimaryButton
                        icon="script"
                        iconPosition="left"
                        className="min-w-[230px] max-w-[244px]"
                      >
                        Save and generate script
                      </ToolsPrimaryButton>
                    </div>
                  </div>

                  <div className="sticky top-4 self-start flex-shrink-0 w-[504px] h-fit">
                    <BuilderBackground />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
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
    </div>
  )
}
