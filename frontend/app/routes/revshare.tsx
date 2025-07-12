import React, { useEffect, useState, useRef } from 'react'

import { useSnapshot } from 'valtio'
import { HeadingCore } from '../components/redesign/components/HeadingCore'
import { Heading5 } from '../components/redesign/Typography'

import { SVGSpinner } from '~/assets/svg'
import { ToolsPrimaryButton } from '../components/redesign/components/ToolsPrimaryButton'
import { ToolsSecondaryButton } from '../components/redesign/components/ToolsSecondaryButton'
import { InputField } from '../components/redesign/components/InputField'
import { ShareInput, ShareInputMobile } from '../components/revshare/shareInput'
import { RevshareChart } from '../components/revshare/chart'
import { useShares, newShare, loadStartingShares } from '../stores/revshareStore'

import { validatePointer, validateWeight, sharesToPaymentPointer, changeList, dropIndex, weightFromPercent, trimDecimal } from '../lib/revshare'

import { toolState, toolActions } from '../stores/toolStore'
import { SVGDeleteScript, SVGCopyScript } from '~/assets/svg'
import { SharesProvider } from '../stores/revshareStore'

export default function RevsharePageWrapper() {
  return (
    <SharesProvider>
      <Revshare />
    </SharesProvider>
  )
}
export function Card({
  children,
  className = ''
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`
      bg-interface-bg-container 
      border border-interface-edge-container
      rounded-sm
      p-lg
      ${className}
    `}
    >
      {children}
    </div>
  )
}
function Revshare() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingScript, setIsLoadingScript] = useState(false)

  const snap = useSnapshot(toolState)
  const { shares, setShares } = useShares()
  const totalWeight = shares.reduce((a, b) => a + Number(b.weight), 0)

  const sharesPP = sharesToPaymentPointer(shares) || 'https://paymentpointer.example/alice'
  const addShare = () => {
    setShares([...shares, newShare()])
  }
  const handleImport = async () => {
    setIsLoading(true)
    try {
      // Simulate an API call to import revshare data
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log('Import successful')
    } catch (error) {
      console.error('Import failed', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddRevShare = async () => {
    setIsLoadingScript(true)
    try {
      // Simulate an API call to add revshare data
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log('Revshare added successfully')
    } catch (error) {
      console.error('Failed to add revshare', error)
    } finally {
      setIsLoadingScript(false)
    }
  }

  return (
    <div className="bg-interface-bg-main min-h-screen w-full pb-[32px]">
      <div className="flex flex-col items-center pt-2xl">
        <div className="w-full max-w-[1280px] px-md sm:px-lg md:px-xl lg:px-md">
          <HeadingCore
            title="Probabilistic revshare"
            onBackClick={() => console.log('Back clicked')}
            className="xl:mt-2xl"
          >
            Probabilistic revenue sharing is a way to share a portion of a web monetized page's earnings between multiple wallet addresses and payment pointers. Each time a web monetized user visits the page, a recipient will be chosen at random. Payments will go to the chosen recipient until the page is closed or reloaded.
          </HeadingCore>

          <div className=" mx-auto space-y-lg">
            <Card className="overflow-x-auto">
              <label className="block pb-2 text-xl font-normal">
                Wallet Address or Payment Pointer
              </label>
              <table className="min-w-full  hidden md:table">
                <thead className="bg-gray-200 font-normal">
                  <tr>
                    <th className="text-left bg-gray-100 p-2 text-gray-400 font-normal rounded-tl-sm rounded-bl-sm">Name</th>
                    <th className="text-left bg-gray-100 p-2 text-gray-400 font-normal">Payment Pointer ...</th>
                    <th className="text-left bg-gray-100 p-2 text-gray-400 font-normal">Weight</th>
                    <th className="text-left bg-gray-100 p-2 text-gray-400 font-normal">Percentage</th>
                    <th className="text-left bg-gray-100 p-2 text-gray-400 font-normal rounded-tr-sm rounded-br-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shares.map((share, i) => {
                    return (
                      <ShareInput
                        key={i}
                        index={i}
                        name={share.name || ''}
                        onChangeName={(name) =>
                          setShares(changeList(shares, i, { name }))
                        }
                        pointer={share.pointer}
                        onChangePointer={(pointer) =>
                          setShares(changeList(shares, i, { pointer }))
                        }
                        weight={share.weight || 0}
                        onChangeWeight={(weight) =>
                          setShares(changeList(shares, i, { weight }))
                        }
                        weightDisabled={!share.pointer}
                        percent={
                          Number(share.weight) ? (share.weight || 1) / totalWeight : 100
                        }
                        percentDisabled={!share.pointer || shares.length <= 1}
                        onChangePercent={(percent) =>
                          setShares(
                            changeList(shares, i, {
                              weight: trimDecimal(
                                weightFromPercent(percent, share.weight || 1, totalWeight),
                              ),
                            }),
                          )
                        }
                        onRemove={() => setShares(dropIndex(shares, i))}
                        removeDisabled={shares.length <= 1}
                      />
                    )
                  })}
                </tbody>
              </table>

              <div className="md:hidden space-y-4">

                {shares.map((share, i) => {
                  return (
                    <ShareInputMobile
                      key={i}
                      index={i}
                      name={share.name || ''}
                      onChangeName={(name) =>
                        setShares(changeList(shares, i, { name }))
                      }
                      pointer={share.pointer}
                      onChangePointer={(pointer) =>
                        setShares(changeList(shares, i, { pointer }))
                      }
                      weight={share.weight || 0}
                      onChangeWeight={(weight) =>
                        setShares(changeList(shares, i, { weight }))
                      }
                      weightDisabled={!share.pointer}
                      percent={
                        Number(share.weight) ? (share.weight || 1) / totalWeight : 100
                      }
                      percentDisabled={!share.pointer || shares.length <= 1}
                      onChangePercent={(percent) =>
                        setShares(
                          changeList(shares, i, {
                            weight: trimDecimal(
                              weightFromPercent(percent, share.weight || 1, totalWeight),
                            ),
                          }),
                        )
                      }
                      onRemove={() => setShares(dropIndex(shares, i))}
                      removeDisabled={shares.length <= 1}
                    />
                  )
                })}
              </div>
            </Card>
          </div>
          <div className="w-full  gap-4 mt-4">
            <div className="w-full flex justify-between bg-gray-200 rounded-lg ">
              <div className="text-sm font-mono p-4 rounded overflow-hidden">
                <span className="text-blue-600">&lt;link</span>
                <span className="text-sky-400"> rel</span>
                <span className="text-pink-400">="monetization"</span>
                <span className="text-sky-400"> href</span>
                <span className="text-pink-400">="{sharesPP}"</span>
                <span className="text-blue-600"> /&gt;</span>
              </div>
              <div className="flex items-center gap-2 p-2">
                <ToolsSecondaryButton
                  className="!border-none !p-0"
                  onClick={() => {
                    navigator.clipboard.writeText(sharesPP)
                    console.log('Payment Pointer copied to clipboard')
                  }}
                >
                  <SVGCopyScript width={36} height={32} color="black" />
                </ToolsSecondaryButton>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-4">

            <ToolsSecondaryButton
              className="xl:w-[143px]"
              disabled={isLoading}
              onClick={handleImport}
            >
              <div className="flex items-center justify-center gap-2">
                {isLoading && <SVGSpinner />}
                <span>{isLoading ? 'Connecting...' : 'Import'}</span>
              </div>
            </ToolsSecondaryButton>

            <ToolsPrimaryButton
              icon="share"
              iconPosition="right"
              className=" flex items-center justify-center"
              onClick={addShare}
            >
              Add rev share
            </ToolsPrimaryButton>

          </div>
          <div className="w-full max-w-[1280px] px-md sm:px-lg md:px-xl lg:px-md">
            <div className="mt-4">
              dddd
              <RevshareChart shares={shares} />
            </div>
          </div>
          <div className=" text-gray-500 mt-4">
            <Heading5>Information</Heading5>
            <p className='text-base leading-md text-text-primary'>
              Each recipient has a different chance of being chosen, depending on their assigned weight. The weight is translated to a percentage which represents the percent of revenue each recipient will receive over time. The higher the weight, the larger the percentage.<br />
              For example, if three recipients each have a weight of 1, then each recipient will eventually receive 33% of the revenue. If three recipients have a weight of 1, 2, and 3, the percentages will be 17% (weight 1), 33% (weight 2), and 50% (weight 3). <br />
              Additional information can be found in the overview of the <a className="underline" href="https://webmonetization.org/tutorials/revenue-sharing" target="_blank">Set up probabilistic revenue sharing</a> tutorial.
            </p>
            <br />
            <p className='text-base font-bold'>Define a revshare</p>
            <p className='text-base leading-md text-text-primary'>
              Enter each payment pointer and wallet address that will receive a split of the revenue into the table. Names are optional. Click <a>Add Share</a> to add more rows. Assign a weight to each recipient. If you'd rather assign sharing by percentage, enter at least two recipients into the table. The Percent field will open for edits.
              When you're finished, add the generated monetization <a>link</a> tag to your site. The link contains a unique URL hosted on <a>https://webmonetization.org/api/revshare/pay/</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}