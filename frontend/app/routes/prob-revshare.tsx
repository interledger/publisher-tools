import React, { useState } from 'react'
import { Heading5 } from '../components/redesign/Typography'
import { SVGSpinner, SVGCheckIcon, SVGCopyIcon } from '~/assets/svg'
import {
  HeadingCore,
  CodeBlock,
  ToolsPrimaryButton,
  ToolsSecondaryButton,
  ImportTagModal
} from '@/components'
import {
  ShareInput,
  ShareInputMobile
} from '../components/redesign/revshare/ShareInput'
import { RevshareChart } from '../components/redesign/revshare/Chart'
import { useShares, newShare, SharesProvider } from '../stores/revshareStore'

import {
  sharesToPaymentPointer,
  changeList,
  dropIndex,
  weightFromPercent,
  trimDecimal,
  tagOrPointerToShares
} from '../lib/revshare'

import { useCopyToClipboard } from '~/components/redesign/hooks/useCopyToClipboard'

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
      rounded-sm
      p-md
      gap-md
      flex flex-col
      ${className}
    `}
    >
      {children}
    </div>
  )
}
function Revshare() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [importTag, setImportTag] = useState('')

  const { shares, setShares } = useShares()
  const totalWeight = shares.reduce((a, b) => a + Number(b.weight), 0)

  const sharesPP = sharesToPaymentPointer(shares) || ''
  const addShare = () => {
    setShares([...shares, newShare()])
  }
  const handleImportConfirm = () => {
    try {
      const shares = tagOrPointerToShares(importTag) || []
      setShares(shares)
      setIsModalOpen(false)
    } catch {
      return 'Invalid revshare tag.'
    }
  }

  const { isCopied, handleCopyClick } = useCopyToClipboard(sharesPP)

  return (
    <div className="bg-interface-bg-main w-full px-md">
      <div className="max-w-[1280px] mx-auto pt-[60px] md:pt-3xl">
        <HeadingCore
          title="Probabilistic revshare"
          onBackClick={() => console.log('Back clicked')}
          className="xl:mt-2xl"
        >
          Probabilistic revenue sharing is a way to share a portion of a web
          monetized page&apos;s earnings between multiple wallet addresses and
          payment pointers. Each time a web monetized user visits the page, a
          recipient will be chosen at random. Payments will go to the chosen
          recipient until the page is closed or reloaded.
        </HeadingCore>

        <div className=" space-y-lg">
          <Card className="overflow-x-auto">
            <label className="block pb-2 text-xl">
              Wallet Address/Payment Pointer
            </label>
            <table className="min-w-full  hidden md:table">
              <thead className="bg-gray-200">
                <tr>
                  <th className="text-left bg-gray-100 p-2 text-gray-400 font-normal rounded-tl-sm rounded-bl-sm">
                    Name
                  </th>
                  <th className="text-left bg-gray-100 p-2 text-gray-400 font-normal">
                    Payment Pointer
                  </th>
                  <th className="text-left bg-gray-100 p-2 text-gray-400 font-normal">
                    Weight
                  </th>
                  <th className="text-left bg-gray-100 p-2 text-gray-400 font-normal">
                    Percentage
                  </th>
                  <th className="text-left bg-gray-100 p-2 text-gray-400 font-normal rounded-tr-sm rounded-br-sm">
                    Action
                  </th>
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
                        Number(share.weight)
                          ? (share.weight || 1) / totalWeight
                          : 100
                      }
                      percentDisabled={!share.pointer || shares.length <= 1}
                      onChangePercent={(percent) =>
                        setShares(
                          changeList(shares, i, {
                            weight: trimDecimal(
                              weightFromPercent(
                                percent,
                                share.weight || 1,
                                totalWeight
                              )
                            )
                          })
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
                      Number(share.weight)
                        ? (share.weight || 1) / totalWeight
                        : 100
                    }
                    percentDisabled={!share.pointer || shares.length <= 1}
                    onChangePercent={(percent) =>
                      setShares(
                        changeList(shares, i, {
                          weight: trimDecimal(
                            weightFromPercent(
                              percent,
                              share.weight || 1,
                              totalWeight
                            )
                          )
                        })
                      )
                    }
                    onRemove={() => setShares(dropIndex(shares, i))}
                    removeDisabled={shares.length <= 1}
                  />
                )
              })}
            </div>
            <hr />
            {/* COMPLETE - Payment Pointer section */}
            {sharesPP && (
              <div className="flex h-[40px] p-sm justify-between items-center rounded-sm bg-interface-bg-main">
                <CodeBlock
                  link={sharesPP}
                  className="flex-1 text-sm p-sm leading-normal whitespace-nowrap min-w-0 overflow-x-auto"
                />
                <button
                  onClick={handleCopyClick}
                  aria-label={isCopied ? 'Copied' : 'Copy code to clipboard'}
                >
                  {isCopied ? (
                    <SVGCheckIcon className="w-6 h-6" />
                  ) : (
                    <SVGCopyIcon className="w-6 h-6" />
                  )}
                </button>
              </div>
            )}
            {/* COMPLETE - Action buttons section */}
            <div className="flex justify-end gap-xs">
              <ToolsSecondaryButton onClick={() => setIsModalOpen(true)}>
                Import
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
          </Card>
        </div>
        {/* COMPLETE - Chart section */}
        <div className="my-lg lg:my-md">
          <RevshareChart shares={shares} />
        </div>
        {/* COMPLETE - Information section */}
        <div className="flex flex-col gap-md mb-2xl">
          <Heading5>Information</Heading5>
          <div>
            <p className="text-sm leading-sm text-field-helpertext-default">
              Each recipient has a different chance of being chosen, depending
              on their assigned weight. The weight is translated to a percentage
              which represents the percent of revenue each recipient will
              receive over time. The higher the weight, the larger the
              percentage.
              <br />
              For example, if three recipients each have a weight of 1, then
              each recipient will eventually receive 33% of the revenue. If
              three recipients have a weight of 1, 2, and 3, the percentages
              will be 17% (weight 1), 33% (weight 2), and 50% (weight 3). <br />
              Additional information can be found in the overview of the&nbsp;
              <a
                className="underline"
                href="https://webmonetization.org/tutorials/revenue-sharing"
                target="_blank"
                rel="noreferrer"
              >
                Set up probabilistic revenue sharing
              </a>
              &nbsp;tutorial.
            </p>
          </div>
          <div>
            <p className="text-field-helpertext-default font-bold text-base leading-md">
              Define a revshare
            </p>
            <p className="text-sm leading-sm text-field-helpertext-default">
              Enter each payment pointer and wallet address that will receive a
              split of the revenue into the table. Names are optional. Click Add
              Share to add more rows. Assign a weight to each recipient. If
              you&apos;d rather assign sharing by percentage, enter at least two
              recipients into the table. The Percent field will open for edits.
              When you&apos;re finished, add the generated monetization link tag
              to your site. The link contains a unique URL hosted on&nbsp;
              <a>https://webmonetization.org/api/revshare/pay/</a>.
            </p>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ImportTagModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleImportConfirm}
          tag={importTag}
          setTag={setImportTag}
        />
      )}
    </div>
  )
}
