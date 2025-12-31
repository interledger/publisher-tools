import React from 'react'
import { useSnapshot } from 'valtio'
import { SVGMarkSuccess } from '@/assets'
import { ToolsPrimaryButton } from '@/components'
import { toWalletAddressUrl } from '@shared/utils'
import { toolState } from '~/stores/toolStore'
import { BaseModal } from './modals/BaseModal'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'

export const ScriptReadyModal: React.FC = () => {
  const scriptContent = getScriptToDisplay()
  const { isCopied, handleCopyClick } = useCopyToClipboard(scriptContent)

  return (
    <BaseModal
      className="p-8 pb-4
        flex flex-col items-center gap-6 w-full max-w-[442px]"
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
    </BaseModal>
  )
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

export default ScriptReadyModal
