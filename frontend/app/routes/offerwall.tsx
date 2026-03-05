import { useEffect, useState } from 'react'
import {
  data,
  useLoaderData,
  useNavigate,
  type MetaFunction,
  type LoaderFunctionArgs,
} from 'react-router'
import { useSnapshot } from 'valtio'
import { SVGSpinner } from '@/assets'
import {
  BuilderBackground,
  BuilderProfileTabs,
  Divider,
  HeadingCore,
  MobileStepsIndicator,
  StepsIndicator,
  ToolsPrimaryButton,
  ToolsSecondaryButton,
  ToolsWalletAddress,
} from '@/components'
import HowItWorks from '~/components/offerwall/HowItWorks'
import { OfferwallBuilder } from '~/components/offerwall/OfferwallBuilder'
import OfferwallPreview from '~/components/offerwall/OfferwallPreview'
import { useBodyClass } from '~/hooks/useBodyClass'
import { useGrantResponseHandler } from '~/hooks/useGrantResponseHandler'
import { usePathTracker } from '~/hooks/usePathTracker'
import { useSaveProfile } from '~/hooks/useSaveProfile'
import { useScrollToWalletAddress } from '~/hooks/useScrollToWalletAddress'
import {
  actions,
  hydrateProfilesFromStorage,
  hydrateSnapshotsFromStorage,
  offerwall,
  subscribeProfilesToStorage,
  subscribeProfilesToUpdates,
} from '~/stores/offerwall-store'
import {
  loadState,
  persistState,
  toolActions,
  toolState,
} from '~/stores/toolStore'
import { commitSession, getSession } from '~/utils/session.server'

export const meta: MetaFunction = () => {
  return [
    { title: 'Offerwall - Publisher Tools' },
    {
      name: 'description',
      content:
        "Help your users who don't have Web Monetization enabled discover it and support your content.",
    },
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
      OP_WALLET_ADDRESS: env.OP_WALLET_ADDRESS,
    },
    {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    },
  )
}

export default function Offerwall() {
  const snap = useSnapshot(toolState)
  const offerwallSnap = useSnapshot(offerwall)
  const navigate = useNavigate()
  const { save, saveLastAction } = useSaveProfile()
  const { walletAddressRef, scrollToWalletAddress } = useScrollToWalletAddress()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingScript, setIsLoadingScript] = useState(false)
  const { grantResponse, isGrantAccepted, isGrantResponse, OP_WALLET_ADDRESS } =
    useLoaderData<typeof loader>()
  usePathTracker()
  useBodyClass('has-fixed-action-bar')

  useEffect(() => {
    const unsubscribeUpdates = subscribeProfilesToUpdates()
    hydrateProfilesFromStorage()
    const unsubscribeStorage = subscribeProfilesToStorage()
    hydrateSnapshotsFromStorage()

    loadState(OP_WALLET_ADDRESS)
    persistState()

    return () => {
      unsubscribeStorage()
      unsubscribeUpdates()
    }
  }, [OP_WALLET_ADDRESS])

  useGrantResponseHandler(grantResponse, isGrantAccepted, isGrantResponse, {
    onGrantSuccess: saveLastAction,
  })

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
      await save(action)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-interface-bg-main w-full">
      <div className="flex flex-col items-center pt-[60px] md:pt-3xl">
        <div className="w-full max-w-[1280px]">
          <HeadingCore
            title="Offerwall experience"
            onBackClick={() => navigate('/')}
          >
            The Offerwall experience helps visitors who don’t yet have Web
            Monetization enabled discover it and support your content.
          </HeadingCore>
          <HowItWorks />

          <Divider className="!my-3xl" />

          <div className="flex flex-col min-h-[756px] px-md xl:flex-row xl:items-start gap-lg">
            <>
              <div
                id="steps-indicator"
                className="hidden xl:block w-[60px] flex-shrink-0 pt-md"
              >
                <StepsIndicator
                  steps={[
                    {
                      number: 1,
                      label: 'Connect',
                      status: snap.walletConnectStep,
                    },
                    {
                      number: 2,
                      label: 'Build',
                      status: snap.buildStep,
                    },
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
                  <ToolsWalletAddress toolName="offerwall experience" />
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

                    <BuilderProfileTabs
                      idPrefix="profile"
                      options={offerwallSnap.profileTabs}
                      selectedId={snap.activeTab}
                      onChange={(profileId) =>
                        toolActions.setActiveTab(profileId)
                      }
                      onRename={(name) => actions.setProfileName(name)}
                    >
                      <OfferwallBuilder
                        onRefresh={() => actions.resetProfileSection()}
                      />
                    </BuilderProfileTabs>

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
                      <OfferwallPreview />
                    </BuilderBackground>
                  </div>
                </div>
              </div>
            </>
          </div>
        </div>
      </div>
    </div>
  )
}
