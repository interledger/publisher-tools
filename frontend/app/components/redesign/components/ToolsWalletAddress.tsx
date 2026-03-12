import React, { useState, useRef, useEffect } from 'react'
import { cx } from 'class-variance-authority'
import { useSnapshot } from 'valtio'
import { ToolsSecondaryButton, InputField, Tooltip } from '@/components'
import { Heading5 } from '@/typography'
import {
  checkHrefFormat,
  getWalletAddress,
  toWalletAddressUrl,
} from '@shared/utils'
import { SVGRefresh, SVGSpinner } from '~/assets/svg'
import { useConnectWallet } from '~/hooks/useConnectWallet'
import { useTranslation } from '~/i18n/useTranslation'
import type { ElementErrors } from '~/lib/types'
import { toolState, toolActions } from '~/stores/toolStore'
import { useUIActions } from '~/stores/uiStore'

interface Props {
  toolName: 'drawer banner' | 'payment widget' | 'offerwall experience'
}

export const ToolsWalletAddress = ({ toolName }: Props) => {
  const { t } = useTranslation()
  const snap = useSnapshot(toolState, { sync: true })
  const { connect, disconnect } = useConnectWallet()
  const uiActions = useUIActions()
  const [error, setError] = useState<ElementErrors>()
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const walletInputApi = {
      focus: () => {
        if (inputRef.current) {
          inputRef.current.focus()
          const length = inputRef.current.value.length
          inputRef.current.setSelectionRange(length, length)
        }
      },
    }

    return uiActions.registerWalletInput(walletInputApi)
  }, [])

  const handleContinue = async () => {
    if (!snap.walletAddress.trim()) {
      setError({
        fieldErrors: {
          walletAddress: [t('toolsWalletAddress__errors__fieldRequired')],
        },
        message: [],
      })
      return
    }

    setIsLoading(true)
    setError(undefined)
    try {
      const walletAddressUrl = checkHrefFormat(
        toWalletAddressUrl(snap.walletAddress),
      )

      const walletAddressInfo = await getWalletAddress(walletAddressUrl)
      toolActions.setWalletAddressId(walletAddressInfo.id)
      await connect()
    } catch (error) {
      setError({
        fieldErrors: { walletAddress: [(error as Error).message] },
        message: [],
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleWalletAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    toolActions.setWalletAddress(e.target.value)

    if (snap.walletConnectStep !== 'unfilled') {
      toolActions.setConnectWalletStep('unfilled')
    }
    if (error) {
      setError(undefined)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!snap.isWalletConnected && !isLoading) {
      handleContinue()
    }
  }

  const getStatusMessage = (): {
    message: string
    type: 'error' | 'success' | 'info'
  } => {
    if (snap.walletConnectStep === 'error') {
      return {
        message: t('toolsWalletAddress__errors__connectionError'),
        type: 'error',
      }
    }
    if (!snap.isWalletConnected) {
      return {
        message: t('toolsWalletAddress__status__connect'),
        type: 'info',
      }
    }
    if (!snap.hasRemoteConfigs) {
      return {
        message: t('toolsWalletAddress__status__no_saved_profiles', {
          toolName,
        }),
        type: 'success',
      }
    }

    return {
      message: t('toolsWalletAddress__status__profiles_fetched', { toolName }),
      type: 'success',
    }
  }

  const statusMessage = getStatusMessage()
  return (
    <form
      onSubmit={handleSubmit}
      className={cx(
        'flex flex-col xl:flex-row xl:items-start gap-2xl p-md bg-white rounded-lg',
        snap.walletConnectStep === 'error' && 'border border-red-600',
      )}
    >
      <div className="items-start gap-md w-full xl:flex-1 xl:grow">
        <div className="inline-flex items-center gap-xs">
          <Heading5 htmlFor="wallet-address-url" as="label">
            {t('toolsWalletAddress__heading__message')}
          </Heading5>
          <Tooltip label={t('toolsWalletAddress__tooltip__ariaLabel')}>
            {t('toolsWalletAddress__tooltip__message')}
            <br /> {t('toolsWalletAddress__tooltip__message_2')}
          </Tooltip>
        </div>
        <div className="flex items-start gap-3 w-full pt-md">
          <div className="flex-1 min-w-0 h-12">
            <InputField
              ref={inputRef}
              id="wallet-address-url"
              placeholder={
                snap.isWalletConnected
                  ? undefined
                  : 'https://walletprovider.com/MyWallet'
              }
              value={snap.walletAddress}
              onChange={handleWalletAddressChange}
              disabled={snap.isWalletConnected}
              readOnly={isLoading}
              error={error?.fieldErrors.walletAddress}
            />
          </div>
          {snap.isWalletConnected && (
            <button
              onClick={disconnect}
              className="flex items-center justify-center w-12 h-12 p-2 rounded-lg shrink-0 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              aria-label={t('toolsWalletAddress__button__disconnectAriaLabel')}
            >
              <SVGRefresh className="w-5 h-5 text-purple-500" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col w-full xl:max-w-[490px] items-start gap-xs xl:flex-1 xl:grow">
        <span
          id="wallet-status"
          role={statusMessage.type === 'error' ? 'alert' : 'status'}
          className={cx(
            'w-full text-style-small-standard',
            statusMessage.type === 'error' && '!text-red-600',
            statusMessage.type === 'success' && '!text-text-success',
          )}
        >
          {statusMessage.message}
        </span>

        {!snap.isWalletConnected && (
          <ToolsSecondaryButton
            type="submit"
            className="xl:w-[143px]"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            <div className="flex items-center justify-center gap-2">
              {isLoading && <SVGSpinner className="w-4 h-4" />}
              <span>
                {isLoading
                  ? t('toolsWalletAddress__button__loadingLabel')
                  : t('toolsWalletAddress__button__submitLabel')}
              </span>
            </div>
          </ToolsSecondaryButton>
        )}
      </div>
    </form>
  )
}
