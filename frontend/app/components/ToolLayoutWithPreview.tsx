import { useEffect, useState, type ComponentProps, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import {
  HeadingCore,
  MobileStepsIndicator,
  ToolsPrimaryButton,
  ToolsSecondaryButton,
  ToolsWalletAddress,
} from '@/components'
import {
  StepsIndicator,
  type StepsIndicatorStep,
} from '@/components/StepsIndicator'
import { SVGSpinner } from '~/assets/svg'
import { useBodyClass } from '~/hooks/useBodyClass'
import { useGrantResponseHandler } from '~/hooks/useGrantResponseHandler'
import { usePathTracker } from '~/hooks/usePathTracker'
import { useSaveProfile } from '~/hooks/useSaveProfile'
import { useScrollToWalletAddress } from '~/hooks/useScrollToWalletAddress'
import { useToolWallet } from '~/hooks/useToolWallet'
import { loadState, persistState } from '~/stores/toolStore'
import type { createWalletStore } from '~/stores/wallet-store'
import type { createToolStoreUtils } from '~/utils/utils.store'

type Props = React.PropsWithChildren<{
  title: string
  description: ReactNode
  additionalDescription?: ReactNode
  walletStore: ReturnType<typeof createWalletStore>
  toolStoreUtils: Pick<
    ReturnType<typeof createToolStoreUtils>,
    | 'subscribeProfilesToStorage'
    | 'hydrateProfilesFromStorage'
    | 'hydrateSnapshotsFromStorage'
    | 'subscribeProfilesToUpdates'
  >
  steps: [StepsIndicatorStep] | [StepsIndicatorStep, StepsIndicatorStep]
  // XXX: Fix me sometime - hacky for now
  stepMiddle?: ReactNode
  walletAddressToolName: ComponentProps<typeof ToolsWalletAddress>['toolName']
  preview: ReactNode
  loaderData: {
    grantResponse?: string
    isGrantAccepted?: boolean
    isGrantResponse?: boolean
    OP_WALLET_ADDRESS: string
  }
}>

export function ToolLayoutWithPreview({
  title,
  description,
  additionalDescription,
  walletStore,
  toolStoreUtils,
  walletAddressToolName,
  steps,
  stepMiddle,
  loaderData,
  preview,
  children,
}: Props) {
  const navigate = useNavigate()
  const { walletAddressRef, scrollToWalletAddress } = useScrollToWalletAddress()

  usePathTracker()
  useBodyClass('has-fixed-action-bar')

  const [walletSnap, walletActions] = useToolWallet({
    wallet: walletStore.wallet,
    actions: walletStore.actions,
  })
  const { save, saveLastAction } = useSaveProfile(walletStore.wallet)

  useEffect(() => {
    const unsubscribeUpdates = toolStoreUtils.subscribeProfilesToUpdates()
    toolStoreUtils.hydrateProfilesFromStorage()
    const unsubscribeStorage = toolStoreUtils.subscribeProfilesToStorage()
    toolStoreUtils.hydrateSnapshotsFromStorage()

    loadState(loaderData.OP_WALLET_ADDRESS)
    persistState()
    walletStore.load()
    walletStore.persist()

    return () => {
      unsubscribeStorage()
      unsubscribeUpdates()
    }
  }, [loaderData.OP_WALLET_ADDRESS])

  useGrantResponseHandler(
    loaderData.grantResponse,
    loaderData.isGrantAccepted,
    loaderData.isGrantResponse,
    { onGrantSuccess: saveLastAction },
  )

  const handleSave = async (action: Parameters<typeof save>[0]) => {
    if (!walletSnap.isWalletConnected) {
      walletActions.setConnectWalletStep('error')
      scrollToWalletAddress()
      return
    }
    await save(action)
  }

  return (
    <div className="bg-interface-bg-main w-full">
      <div className="flex flex-col items-center pt-[60px] md:pt-3xl">
        <div className="w-full max-w-[1280px]">
          <div className=" px-md">
            <HeadingCore title={title} onBackClick={() => navigate('/')}>
              {description}
            </HeadingCore>
            {additionalDescription}
          </div>

          <div className="flex flex-col min-h-[756px] px-md xl:flex-row xl:items-start gap-lg">
            <div
              id="steps-indicator"
              className="hidden xl:block w-[60px] flex-shrink-0 pt-md"
            >
              <StepsIndicator
                steps={[
                  {
                    number: 1,
                    label: 'Connect',
                    status: walletSnap.walletConnectStep,
                  },
                  ...steps,
                ]}
              />
            </div>

            <div className="flex flex-col gap-2xl xl:gap-12 flex-1">
              <div id="wallet-address" ref={walletAddressRef}>
                <MobileStepsIndicator
                  number={1}
                  label="Connect"
                  status={walletSnap.walletConnectStep}
                />
                <ToolsWalletAddress
                  store={walletSnap}
                  walletActions={walletActions}
                  toolName={walletAddressToolName}
                />
              </div>

              <div className="flex flex-col xl:flex-row gap-2xl">
                <div className="flex flex-col gap-2xl xl:flex-1">
                  {steps.length > 1 && stepMiddle && (
                    <div
                      id="configure-builder"
                      className="w-full xl:max-w-[628px]"
                    >
                      <MobileStepsIndicator
                        number={steps[0].number}
                        label={steps[0].label}
                        status={steps[0].status}
                      />

                      <div className="space-y-4">{stepMiddle}</div>
                    </div>
                  )}

                  <div id="builder" className="w-full xl:max-w-[628px]">
                    <MobileStepsIndicator
                      number={steps.at(-1)!.number}
                      label={steps.at(-1)!.label}
                      status={steps.at(-1)!.status}
                    />

                    {children}

                    <BuilderActions handleSave={handleSave} />
                  </div>
                </div>

                <div
                  id="preview"
                  className="w-full mx-auto xl:mx-0 xl:sticky xl:top-md xl:self-start xl:flex-shrink-0 xl:w-[504px] h-fit"
                >
                  {preview}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

type SaveAction = 'save-success' | 'script'
type BuilderActionsProps = {
  handleSave: (action: SaveAction) => Promise<void>
}

function BuilderActions({ handleSave }: BuilderActionsProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const onClickSave = async () => {
    setIsSaving(true)
    await handleSave('save-success').finally(() => setIsSaving(false))
  }

  const onClickScript = async () => {
    setIsGenerating(true)
    await handleSave('script').finally(() => setIsGenerating(false))
  }

  return (
    <div
      id="builder-actions"
      className="xl:flex xl:items-center xl:justify-end xl:gap-sm xl:mt-lg xl:static xl:bg-transparent xl:p-0 xl:border-0 xl:backdrop-blur-none xl:flex-row fixed bottom-0 left-0 right-0 flex flex-col gap-xs px-md sm:px-lg md:px-xl py-md bg-interface-bg-stickymenu/95 backdrop-blur-[20px] border-t border-field-border z-40"
    >
      <div
        id="builder-actions-inner"
        className="xl:contents flex flex-col gap-xs mx-auto w-full xl:w-auto xl:p-0 xl:mx-0 xl:flex-row xl:gap-sm"
      >
        <ToolsSecondaryButton
          className="xl:w-[150px] xl:rounded-lg w-full min-w-0 border-0 xl:border order-last xl:order-first"
          disabled={isSaving}
          onClick={onClickSave}
        >
          <div className="flex items-center justify-center gap-2">
            {isSaving && <SVGSpinner className="w-4 h-4" />}
            <span>{isSaving ? 'Saving...' : 'Save edits only'}</span>
          </div>
        </ToolsSecondaryButton>

        <ToolsPrimaryButton
          icon="script"
          iconPosition={isGenerating ? 'none' : 'left'}
          className="xl:w-[250px] xl:rounded-lg w-full min-w-0 order-first xl:order-last"
          disabled={isGenerating}
          onClick={onClickScript}
        >
          <div className="flex items-center justify-center gap-xs">
            {isGenerating && <SVGSpinner className="w-4 h-4" />}
            <span>
              {isGenerating ? 'Saving...' : 'Save and generate script'}
            </span>
          </div>
        </ToolsPrimaryButton>
      </div>
    </div>
  )
}
