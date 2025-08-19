import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from '@remix-run/react'
import type { MetaFunction } from '@remix-run/cloudflare'
import {
  Card,
  CodeBlock,
  HeadingCore,
  ImportTagModal,
  RevShareChart,
  RevShareInfo,
  ShareInput,
  ShareInputHeader,
  ShareInputTable,
  ToolsPrimaryButton,
  ToolsSecondaryButton
} from '@/components'
import {
  changeList,
  dropIndex,
  sharesToPaymentPointer,
  tagOrPointerToShares,
  validatePointer,
  validateShares
} from '../lib/revshare'
import { newShare, SharesProvider, useShares } from '../stores/revshareStore'
import { Heading5 } from '../components/redesign/Typography'

export const meta: MetaFunction = () => {
  return [
    { title: 'Probabilistic Revshare - Web Monetization Tools' },
    {
      name: 'description',
      content:
        'Create a probabilistic revenue share to split Web Monetization earnings among multiple recipients.'
    }
  ]
}

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

const getPlaceholderText = (index: number) => {
  return index === 0
    ? DEFAULT_WALLET_ADDRESS
    : index === 1
      ? DEFAULT_PAYMENT_POINTER
      : DEFAULT_PLACEHOLDER
}

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

  const handleRemove = useCallback(
    (index: number) => {
      const newShares = dropIndex(shares, index)
      setShares(newShares.length > 1 ? newShares : [...newShares, newShare()])
    },
    [shares, setShares]
  )

  const showDeleteColumn = shares.length > 2
  const hasValidShares = validateShares(shares)

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
          <ShareInputTable>
            <ShareInputHeader showDelete={showDeleteColumn} />
            <div role="rowgroup" className="contents">
              {shares.map((share, i) => {
                return (
                  <ShareInput
                    key={i}
                    index={i}
                    name={share.name || ''}
                    onChangeName={(name) => handleChangeName(i, name)}
                    pointer={share.pointer}
                    onChangePointer={(pointer) =>
                      handleChangePointer(i, pointer)
                    }
                    weight={share.weight || 0}
                    onChangeWeight={(weight) => handleChangeWeight(i, weight)}
                    weightDisabled={!share.pointer}
                    percent={
                      totalWeight > 0 ? (share.weight || 0) / totalWeight : 0
                    }
                    onRemove={() => handleRemove(i)}
                    validatePointer={validatePointer}
                    showDelete={showDeleteColumn}
                    placeholder={getPlaceholderText(i)}
                  />
                )
              })}
            </div>
          </ShareInputTable>
          <hr className={!hasValidShares ? 'md:mt-2xs' : ''} />
          <div className="flex flex-col-reverse md:flex-col gap-md">
            {revSharePointers && hasValidShares && (
              <CodeBlock link={revSharePointers} />
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
        <RevShareInfo />
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
