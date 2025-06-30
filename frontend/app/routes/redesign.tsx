import React, { useEffect } from 'react'
import { useSnapshot } from 'valtio'
import { StepsIndicator } from '~/components/redesign/components/StepsIndicator'
import { ToolsWalletAddress } from '../components/redesign/components/ToolsWalletAddress'
import { HeadingCore } from '../components/redesign/components/HeadingCore'
import { BuilderForm } from '~/components/redesign/components/BuilderForm'
import { BuilderBackground } from '~/components/redesign/components/BuilderBackground'
import { ToolsSecondaryButton } from '~/components/redesign/components/ToolsSecondaryButton'
import { ToolsPrimaryButton } from '~/components/redesign/components/ToolsPrimaryButton'
import { toolState, persistState, loadState } from '~/stores/toolStore'

export default function Redesign() {
  const snap = useSnapshot(toolState)

  useEffect(() => {
    loadState()
    persistState()
  }, [])

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
                      <ToolsSecondaryButton>
                        Save edits only
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
    </div>
  )
}
