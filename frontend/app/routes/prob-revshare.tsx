import { useCallback, useMemo, useState } from 'react'
import { useNavigate, type MetaFunction } from 'react-router'
import {
  Card,
  CodeBlockLink,
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
import { API_URL } from '@shared/defines'
import { Heading5 } from '../components/redesign/Typography'
import {
  changeList,
  dropIndex,
  sharesToPaymentPointer,
  tagOrPointerToShares,
  validateShares
} from '../lib/revshare'
import { newShare, SharesProvider, useShares } from '../stores/revshareStore'

export const meta: MetaFunction = () => {
  return [
    { title: 'Probabilistic Revshare - Publisher Tools' },
    {
      name: 'description',
      content:
        'Create a probabilistic revenue share to split Web Monetization earnings among multiple recipients.'
    }
  ]
}

const baseUrl = new URL('/revshare/', API_URL).href

export default function RevsharePageWrapper() {
  return (
    <SharesProvider>
      <Revshare />
    </SharesProvider>
  )
}

function Revshare() {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [importTag, setImportTag] = useState('')
  const [importError, setImportError] = useState('')
  const { shares, setShares } = useShares()

  const showDeleteColumn = shares.length > 2
  const revShareUrl = useMemo(
    () => sharesToPaymentPointer(shares, baseUrl) ?? '',
    [shares]
  )
  const totalWeight = useMemo(
    () => shares.reduce((a, b) => a + Number(b.weight), 0),
    [shares]
  )
  const hasValidShares = validateShares(shares)

  const addShare = useCallback(() => {
    setShares((prevShares) => [...prevShares, newShare()])
  }, [setShares])

  const handleRemove = useCallback(
    (index: number) => {
      setShares((prevShares) => dropIndex(prevShares, index))
    },
    [setShares]
  )

  const handleChangeName = useCallback(
    (index: number, name: string) => {
      setShares((prevShares) => changeList(prevShares, index, { name }))
    },
    [setShares]
  )

  const handleChangePointer = useCallback(
    (index: number, pointer: string) => {
      setShares((prevShares) =>
        changeList(prevShares, index, { pointer: pointer.trim() })
      )
    },
    [setShares]
  )

  const handleChangeWeight = useCallback(
    (index: number, weight: number) => {
      setShares((prevShares) => changeList(prevShares, index, { weight }))
    },
    [setShares]
  )

  const handleValidationChange = useCallback(
    (index: number, isValid: boolean) => {
      setShares((prevShares) => changeList(prevShares, index, { isValid }))
    },
    [setShares]
  )

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
    setImportError('')
    setImportTag('')
  }, [setIsModalOpen, setImportError, setImportTag])

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
                    key={share.id}
                    index={i}
                    name={share.name || ''}
                    pointer={share.pointer}
                    weight={share.weight || 0}
                    percent={
                      totalWeight > 0 ? (share.weight || 0) / totalWeight : 0
                    }
                    onChangeName={(name) => handleChangeName(i, name)}
                    onChangePointer={(pointer) =>
                      handleChangePointer(i, pointer)
                    }
                    onChangeWeight={(weight) => handleChangeWeight(i, weight)}
                    onValidationChange={handleValidationChange}
                    onRemove={() => handleRemove(i)}
                    showDelete={showDeleteColumn}
                    weightDisabled={!share.pointer}
                  />
                )
              })}
            </div>
          </ShareInputTable>
          <ToolsPrimaryButton
            icon="share"
            iconPosition="right"
            className="self-center w-full md:w-fit"
            onClick={addShare}
          >
            + Add recipient
          </ToolsPrimaryButton>
          <hr className={!hasValidShares ? 'md:mt-2xs' : ''} />
          <div className="flex flex-col-reverse md:flex-col gap-md">
            {hasValidShares && <CodeBlockLink link={revShareUrl} />}
            <ToolsSecondaryButton
              className="self-end w-full md:w-fit"
              onClick={() => setIsModalOpen(true)}
            >
              Import
            </ToolsSecondaryButton>
          </div>
        </Card>
        <div className="my-lg md:my-md">
          {hasValidShares && <RevShareChart shares={shares} />}
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
