import React, { useState, useId, useRef, useEffect } from 'react'
import { cx } from 'class-variance-authority'
import { useSnapshot } from 'valtio'
import {
  checkHrefFormat,
  getWalletAddress,
  toWalletAddressUrl
} from '@shared/utils'
import { SVGRefresh, SVGSpinner } from '~/assets/svg'
import type { ElementErrors } from '~/lib/types'
import { toolState, toolActions } from '~/stores/toolStore'
import { useUIActions } from '~/stores/uiStore'
import { InputField } from './InputField'
import { ToolsSecondaryButton } from './ToolsSecondaryButton'
import { Tooltip } from './Tooltip'
import { Heading5 } from '../Typography'

export const ToolsWalletAddress = () => {
  const snap = useSnapshot(toolState)
  const uiActions = useUIActions()
  const [error, setError] = useState<ElementErrors>()
  const [isLoading, setIsLoading] = useState(false)
  const generatedId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const walletInputApi = {
      focus: () => {
        if (inputRef.current) {
          inputRef.current.focus()
          const length = inputRef.current.value.length
          inputRef.current.setSelectionRange(length, length)
        }
      }
    }

    return uiActions.registerWalletInput(walletInputApi)
  }, [])

  const handleContinue = async () => {
    if (!snap.walletAddress.trim()) {
      setError({
        fieldErrors: { walletAddress: ['This field is required'] },
        message: []
      })
      return
    }

    setIsLoading(true)
    setError(undefined)
    try {
      const walletAddressUrl = checkHrefFormat(
        toWalletAddressUrl(snap.walletAddress)
      )

      const walletAddressInfo = await getWalletAddress(walletAddressUrl)
      const result = await toolActions.fetchRemoteConfigs(walletAddressInfo.id)

      if (result.hasConflict) {
        toolActions.handleConfigurationConflict(result.fetchedConfigs)
        return
      }

      toolActions.setHasRemoteConfigs(result.hasCustomEdits)

      if (result.hasCustomEdits) {
        toolActions.setConfigs(result.fetchedConfigs)
      }

      toolActions.setWalletAddressId(walletAddressInfo.id)
      toolActions.setWalletConnected(true)
      setError(undefined)
    } catch (error) {
      setError({
        fieldErrors: { walletAddress: [(error as Error).message] },
        message: []
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = () => {
    toolActions.setWalletConnected(false)
    toolActions.setHasRemoteConfigs(false)
    toolActions.setConfigs(null)
  }

  const handleWalletAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    toolActions.setWalletAddress(e.target.value)

    if (snap.walletConnectStep !== 'unfilled') {
      toolActions.setConnectWalletStep('unfilled')
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!snap.isWalletConnected && !isLoading) {
      handleContinue()
    }
  }

  const renderStatusMessage = () => {
    if (snap.walletConnectStep === 'error') {
      return (
        <p className="w-full text-style-small-standard !text-red-600">
          You have not connected your wallet address yet.
        </p>
      )
    }

    if (!snap.isWalletConnected) {
      return (
        <p className="w-full text-style-small-standard">
          If you&apos;re connecting your wallet address for the first time,
          you&apos;ll start with the default configuration.
          <br />
          You can then customize and save your config as needed.
        </p>
      )
    }

    if (!snap.hasRemoteConfigs) {
      return (
        <p className="w-full text-style-small-standard !text-text-success">
          There are no custom edits for the drawer banner correlated to this
          wallet address but you can start customizing when you want.
        </p>
      )
    }

    return (
      <p className="w-full text-style-small-standard !text-text-success">
        We&apos;ve loaded your configuration.
        <br />
        Feel free to keep customizing your banner to fit your style.
      </p>
    )
  }
  return (
    <form
      onSubmit={handleSubmit}
      className={cx(
        'flex flex-col xl:flex-row xl:items-start gap-2xl p-md bg-white rounded-lg',
        snap.walletConnectStep === 'error' && 'border border-red-600'
      )}
      aria-labelledby={generatedId}
    >
      <div className="flex flex-col items-start gap-md w-full xl:flex-1 xl:grow">
        <div className="inline-flex items-center gap-xs">
          <Heading5 id={generatedId}>Wallet address</Heading5>
          <Tooltip>
            Your wallet is required in order for us to save this components
            configuration for you, link it to the original author, and verify
            ownership for future updates. It also embeds the wallet address into
            your web page automatically, enabling Web Monetization on your
            behalf.
          </Tooltip>
        </div>

        <div
          id="wallet-address-input"
          className="flex items-start gap-3 w-full"
        >
          <div className="flex-1 min-w-0 h-12">
            <InputField
              ref={inputRef}
              id="wallet-address-url"
              placeholder={
                snap.isWalletConnected
                  ? undefined
                  : 'https://walletprovider.com/MyWallet'
              }
              defaultValue={snap.walletAddress}
              onBlur={handleWalletAddressChange}
              disabled={snap.isWalletConnected}
              error={error?.fieldErrors.walletAddress}
              aria-labelledby={generatedId}
            />
          </div>
          {snap.isWalletConnected && (
            <button
              onClick={() => {
                handleDisconnect()
                uiActions.focusWalletInput()
              }}
              className="flex items-center justify-center w-12 h-12 p-2 rounded-lg shrink-0 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              aria-label="Disconnect wallet"
            >
              <SVGRefresh className="w-5 h-5 text-purple-500" />
            </button>
          )}
        </div>
      </div>

      <div
        id="wallet-address-message"
        className="flex flex-col w-full xl:max-w-[490px] items-start gap-xs xl:flex-1 xl:grow"
      >
        {renderStatusMessage()}
        {!snap.isWalletConnected && (
          <ToolsSecondaryButton
            type="submit"
            className="xl:w-[143px]"
            disabled={isLoading}
          >
            <div className="flex items-center justify-center gap-2">
              {isLoading && <SVGSpinner className="w-4 h-4" />}
              <span>{isLoading ? 'Connecting...' : 'Continue'}</span>
            </div>
          </ToolsSecondaryButton>
        )}
      </div>
    </form>
  )
}
