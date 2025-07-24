import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from '@remix-run/react'
import { Heading5 } from '../components/redesign/Typography'
import { SVGCheckIcon, SVGCopyIcon } from '~/assets/svg'
import {
  HeadingCore,
  CodeBlock,
  ToolsPrimaryButton,
  ToolsSecondaryButton,
  ImportTagModal,
  Card,
  RevShareChart
} from '@/components'
import {
  ShareInput,
  ShareInputHeader
} from '../components/redesign/components/revshare/ShareInput'
import { useShares, newShare, SharesProvider } from '../stores/revshareStore'

import {
  sharesToPaymentPointer,
  changeList,
  dropIndex,
  weightFromPercent,
  trimDecimal,
  tagOrPointerToShares,
  validateShares,
  validatePointer
} from '../lib/revshare'

import { useCopyToClipboard } from '~/components/redesign/hooks/useCopyToClipboard'

export default function RevsharePageWrapper() {
  return (
    <SharesProvider>
      <Revshare />
    </SharesProvider>
  )
}

const DEFAULT_PLACEHOLDER = 'Wallet Address/Payment Pointer'
const DEFAULT_WALLET_ADDRESS = 'https://walletprovider.com/myWallet'
const DEFAULT_PAYMENT_POINTER = '$walletprovider.com/myWallet'

function Revshare() {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [importTag, setImportTag] = useState('')
  const [importError, setImportError] = useState('')
  const { shares, setShares } = useShares()

  const revSharePointers = useMemo(
    () => sharesToPaymentPointer(shares),
    [shares]
  )

  const { isCopied, handleCopyClick } = useCopyToClipboard(
    `<link rel="monetization" href="${revSharePointers}" />`
  )

  const totalWeight = useMemo(
    () => shares.reduce((a, b) => a + Number(b.weight), 0),
    [shares]
  )

  const addShare = useCallback(() => {
    setShares([...shares, newShare()])
  }, [shares, setShares])

  const handleLinkTagImport = useCallback(() => {
    try {
      setImportError('')
      const importedShares = tagOrPointerToShares(importTag) || []
      setShares(importedShares)
      setIsModalOpen(false)
      setImportTag('')
    } catch (err: unknown) {
      setImportError((err as Error).message || 'An unexpected error occurred.')
    }
  }, [importTag, setShares, setIsModalOpen])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    if (importError) {
      setImportError('')
    }
    setImportTag('')
  }, [setIsModalOpen, setImportError, importError, setImportTag])

  const handleChangeName = useCallback(
    (index: number, name: string) => {
      setShares(changeList(shares, index, { name }))
    },
    [shares, setShares]
  )

  const handleChangePointer = useCallback(
    (index: number, pointer: string) => {
      setShares(changeList(shares, index, { pointer }))
    },
    [shares, setShares]
  )

  const handleChangeWeight = useCallback(
    (index: number, weight: number) => {
      setShares(changeList(shares, index, { weight }))
    },
    [shares, setShares]
  )

  const handleChangePercent = useCallback(
    (
      index: number,
      percent: number,
      shareWeight: number,
      totalWeight: number
    ) => {
      setShares(
        changeList(shares, index, {
          weight: trimDecimal(
            weightFromPercent(percent, shareWeight || 1, totalWeight)
          )
        })
      )
    },
    [shares, setShares]
  )

  const handleRemove = useCallback(
    (index: number) => {
      setShares(dropIndex(shares, index))
    },
    [shares, setShares]
  )

  const hasValidShares = validateShares(shares)

  const displayPlaceholder = (index: number) => {
    return index === 0
      ? DEFAULT_WALLET_ADDRESS
      : index === 1
        ? DEFAULT_PAYMENT_POINTER
        : DEFAULT_PLACEHOLDER
  }
  return (
    <div className="bg-interface-bg-main w-full px-md">
      <div className="max-w-[1280px] mx-auto pt-[60px] md:pt-3xl">
        <HeadingCore
          title="Probabilistic Revenue Share"
          onBackClick={() => navigate('/')}
        >
          Probabilistic revenue sharing is a way to share a portion of a web
          monetized page&apos;s earnings between multiple recipients. Each time
          a web monetized user visits the page, a recipient will be chosen at
          random. Payments will go to the chosen recipient until the page is
          closed or reloaded.
        </HeadingCore>
        <Card>
          <Heading5>Recipients</Heading5>
          <ShareInputHeader />
          {shares.map((share, i) => {
            return (
              <ShareInput
                key={i}
                index={i}
                name={share.name || ''}
                onChangeName={(name) => handleChangeName(i, name)}
                pointer={share.pointer}
                onChangePointer={(pointer) => handleChangePointer(i, pointer)}
                weight={share.weight || 0}
                onChangeWeight={(weight) => handleChangeWeight(i, weight)}
                weightDisabled={!share.pointer}
                percent={
                  totalWeight > 0 ? (share.weight || 0) / totalWeight : 0
                }
                percentDisabled={!share.pointer || shares.length <= 1}
                onChangePercent={(percent) =>
                  handleChangePercent(
                    i,
                    percent,
                    share.weight || 1,
                    totalWeight
                  )
                }
                onRemove={() => handleRemove(i)}
                validatePointer={validatePointer}
                placeholder={displayPlaceholder(i)}
              />
            )
          })}
          <hr className={!hasValidShares ? 'md:mt-2xs' : ''} />
          <div className="flex flex-col-reverse md:flex-col gap-md">
            {revSharePointers && hasValidShares && (
              <div className="flex h-[40px] items-center justify-between rounded-sm bg-interface-bg-main p-sm">
                <CodeBlock
                  link={revSharePointers}
                  className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap p-sm text-sm leading-normal"
                />
                <button
                  onClick={handleCopyClick}
                  aria-label={isCopied ? 'Copied' : 'Copy code to clipboard'}
                >
                  {isCopied ? (
                    <SVGCheckIcon className="h-6 w-6" />
                  ) : (
                    <SVGCopyIcon className="h-6 w-6" />
                  )}
                </button>
              </div>
            )}
            <div className="flex flex-col-reverse md:flex-row justify-end gap-xs">
              <ToolsSecondaryButton
                className="w-full md:w-auto"
                onClick={() => setIsModalOpen(true)}
              >
                Import
              </ToolsSecondaryButton>
              <ToolsPrimaryButton
                icon="share"
                iconPosition="right"
                className="flex w-full items-center justify-center md:w-auto"
                onClick={addShare}
              >
                Add recipient
              </ToolsPrimaryButton>
            </div>
          </div>
        </Card>
        <div className="my-lg md:my-md">
          <RevShareChart shares={shares} />
        </div>
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
              to your site. The link contains a unique URL hosted on
              https://webmonetization.org/api/revshare/pay/.
            </p>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ImportTagModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onConfirm={handleLinkTagImport}
          tag={importTag}
          setTag={setImportTag}
          errorMessage={importError}
          setImportError={setImportError}
        />
      )}
    </div>
  )
}
