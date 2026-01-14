import React, { useState, useRef, useEffect } from 'react'
import { cx } from 'class-variance-authority'
import { useSnapshot } from 'valtio'
import {
  ToolsSecondaryButton,
  InputField,
  Tooltip,
  ProfilesDialog
} from '@/components'
import { Heading5 } from '@/typography'
import {
  checkHrefFormat,
  getWalletAddress,
  toWalletAddressUrl
} from '@shared/utils'
import { SVGRefresh, SVGSpinner } from '~/assets/svg'
import { useDialog } from '~/hooks/useDialog'
import type { ElementErrors } from '~/lib/types'
import { actions } from '~/stores/banner-store'
import { toolState, toolActions } from '~/stores/toolStore'
import { useUIActions } from '~/stores/uiStore'
import { convertFrom } from '~/utils/profile-converter'

interface ToolsWalletAddressProps {
  toolName: 'drawer banner' | 'payment widget'
}

export const ToolsWalletAddress = ({ toolName }: ToolsWalletAddressProps) => {
  const snap = useSnapshot(toolState, { sync: true })
  const [openDialog] = useDialog()
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
        openDialog(
          <ProfilesDialog
            fetchedConfigs={result.fetchedConfigs}
            currentLocalConfigs={{ ...toolState.configurations }}
            modifiedVersions={[...toolState.dirtyProfiles]}
          />
        )
        return
      }

      toolActions.setHasRemoteConfigs(result.hasCustomEdits)

      if (result.hasCustomEdits) {
        toolActions.setConfigs(result.fetchedConfigs)
        actions.setProfiles(convertFrom(result.fetchedConfigs, 'banner'))
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
    actions.resetProfiles()
  }

  const handleWalletAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>
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
        message: 'You have not connected your wallet address yet.',
        type: 'error'
      }
    }
    if (!snap.isWalletConnected) {
      return {
        message:
          "If you're connecting your wallet address for the first time, you'll start with the default configuration. You can then customize and save your config as needed.",
        type: 'info'
      }
    }
    if (!snap.hasRemoteConfigs) {
      return {
        message: `There are no custom edits for the ${toolName} correlated to this wallet address but you can start customizing when you want.`,
        type: 'success'
      }
    }

    return {
      message: `We've loaded your configuration. Feel free to keep customizing your ${toolName} to fit your style.`,
      type: 'success'
    }
  }

  const statusMessage = getStatusMessage()
  return (
    <form
      onSubmit={handleSubmit}
      className={cx(
        'flex flex-col xl:flex-row xl:items-start gap-2xl p-md bg-white rounded-lg',
        snap.walletConnectStep === 'error' && 'border border-red-600'
      )}
    >
      <div className="items-start gap-md w-full xl:flex-1 xl:grow">
        <div className="inline-flex items-center gap-xs">
          <Heading5 htmlFor="wallet-address-url" as="label">
            Wallet address
          </Heading5>
          <Tooltip label="Why do I need to connect my wallet?">
            Your wallet is required to save this component&apos;s configuration, link it to the original author, and verify ownership for future updates.
            <br />
            It also embeds the wallet address into your web page automatically, enabling Web Monetization on your behalf.
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

      <div className="flex flex-col w-full xl:max-w-[490px] items-start gap-xs xl:flex-1 xl:grow">
        <span
          id="wallet-status"
          role={statusMessage.type === 'error' ? 'alert' : 'status'}
          className={cx(
            'w-full text-style-small-standard',
            statusMessage.type === 'error' && '!text-red-600',
            statusMessage.type === 'success' && '!text-text-success'
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
              <span>{isLoading ? 'Connecting...' : 'Continue'}</span>
            </div>
          </ToolsSecondaryButton>
        )}
      </div>
    </form>
  )
}
