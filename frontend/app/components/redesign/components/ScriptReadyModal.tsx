import React from 'react'
import { cx } from 'class-variance-authority'
import { useSnapshot } from 'valtio'
import { SVGMarkSuccess } from '@/assets'
import { ToolsPrimaryButton } from '@/components'
import { toWalletAddressUrl } from '@shared/utils'
import { toolState } from '~/stores/toolStore'
import { BaseModal } from './modals/BaseModal'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'

interface ScriptReadyModalProps {
  className?: string
}

function getScriptToDisplay(): string {
  const {
    walletAddress,
    walletAddressId,
    currentToolType: toolType,
    activeVersion: preset,
    cdnUrl
  } = useSnapshot(toolState)

  const wa = toWalletAddressUrl(walletAddress)
  const src = new URL(`/${toolType}.js`, cdnUrl).href

  const script = document.createElement('script')
  script.id = `wmt-${toolType}-init-script`
  script.type = 'module'
  script.src = src
  script.dataset.walletAddress = wa
  if (walletAddressId && wa !== walletAddressId) {
    script.dataset.walletAddressId = walletAddressId
  }
  script.dataset.tag = preset

  return script.outerHTML
}

export const ScriptReadyModal: React.FC<ScriptReadyModalProps> = ({
  className = ''
}) => {
  const scriptContent = getScriptToDisplay()
  const { isCopied, handleCopyClick } = useCopyToClipboard(scriptContent)

  return (
    <BaseModal>
      <div
        className={cx(
          'bg-interface-bg-container',
          'border border-interface-edge-container',
          'rounded-lg',
          'p-xl pt-xl pb-md',
          'flex flex-col items-center gap-lg',
          'w-full max-w-[442px]',
          'relative',
          className
        )}
      >
        <div className="flex items-center justify-center">
          <SVGMarkSuccess className="w-[60px] h-[60px]" />
        </div>
        <div className="text-center">
          <p className="text-base leading-md font-normal text-text-primary">
            Your script is ready
          </p>
        </div>
        <div className="w-full bg-mint-50 border border-green-200 rounded-lg p-sm">
          <output className="text-sm font-mono text-text-primary break-all">
            {scriptContent}
          </output>
        </div>
        <div className="w-full">
          <ToolsPrimaryButton
            icon={isCopied ? 'check' : 'copy'}
            iconPosition="right"
            className="w-full flex items-center justify-center"
            onClick={handleCopyClick}
          >
            {isCopied ? 'Copied' : 'Copy'} to clipboard
          </ToolsPrimaryButton>
        </div>
      </div>
    </BaseModal>
  )
}

export default ScriptReadyModal
