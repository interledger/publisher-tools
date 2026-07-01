import React, { useState, useRef, useEffect } from 'react'
import { cx } from 'class-variance-authority'
import { ToolsSecondaryButton, InputField, Tooltip } from '@/components'
import { Heading5 } from '@/typography'
import { type Tool } from '@shared/types'
import {
  checkHrefFormat,
  getWalletAddress,
  toWalletAddressUrl,
} from '@shared/utils'
import { SVGRefresh, SVGSpinner } from '~/assets/svg'
import { useConnectWallet } from '~/hooks/useConnectWallet'
import { useTranslation } from '~/i18n/useTranslation'
import { useTrackEvent } from '~/lib/analytics'
import { useUIActions } from '~/stores/uiStore'
import type { WalletActions, WalletStore } from '~/stores/wallet-store'

interface Props {
  store: WalletStore
  walletActions: WalletActions
  tool: Tool
}

const TOOL_DISPLAY_NAMES = {
  banner: 'drawer banner',
  widget: 'payment widget',
  offerwall: 'offerwall experience',
  paywall: 'pay per article',
} as const satisfies Record<Tool, string>

export const ToolsWalletAddress = ({
  store: snap,
  walletActions,
  tool,
}: Props) => {
  const t = useTranslation('toolsWalletAddress')
  const { connect, disconnect } = useConnectWallet(snap, walletActions)
  const uiActions = useUIActions()
  const trackEvent = useTrackEvent()
  const [error, setError] = useState<{ walletAddress?: string[] }>()
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
        walletAddress: [t('errors.fieldRequired')],
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
      walletActions.setWalletAddressId(walletAddressInfo.id)
      walletActions.setWalletAddressInfo(walletAddressInfo)
      await connect()
      trackEvent('wallet_connected', {
        wallet_provider: new URL(walletAddressInfo.id).hostname,
      })
    } catch (error) {
      setError({ walletAddress: [(error as Error).message] })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = () => {
    trackEvent('wallet_disconnected')
    disconnect()
  }

  const handleWalletAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    walletActions.setWalletAddress(e.target.value)

    if (snap.walletConnectStep !== 'unfilled') {
      walletActions.setConnectWalletStep('unfilled')
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
        message: t('errors.connectionError'),
        type: 'error',
      }
    }
    if (!snap.isWalletConnected) {
      return {
        message: t('status.connect'),
        type: 'info',
      }
    }
    if (!snap.hasRemoteConfigs) {
      return {
        message: t(`status.noSavedProfiles.${tool}`),
        type: 'success',
      }
    }

    const key =
      tool === 'paywall' ? 'status.profileFetched' : 'status.profilesFetched'
    return {
      message: t(key, { toolName: TOOL_DISPLAY_NAMES[tool] }),
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
            {t('heading.message')}
          </Heading5>
          <Tooltip label={t('tooltip.ariaLabel')}>
            {t('tooltip.message')}
            <br /> {t('tooltip.message2')}
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
              error={error?.walletAddress}
            />
          </div>
          {snap.isWalletConnected && (
            <button
              onClick={handleDisconnect}
              className="flex items-center justify-center w-12 h-12 p-2 rounded-lg shrink-0 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              aria-label={t('button.disconnectAriaLabel')}
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
                {isLoading ? t('button.loadingLabel') : t('button.submitLabel')}
              </span>
            </div>
          </ToolsSecondaryButton>
        )}
      </div>
    </form>
  )
}
