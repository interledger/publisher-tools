import React from 'react'
import { useSnapshot } from 'valtio'
import { SVGMarkSuccess } from '@/assets'
import { ToolsPrimaryButton } from '@/components'
import { toWalletAddressUrl } from '@shared/utils'
import { toolState } from '~/stores/toolStore'
import { BaseDialog } from './BaseDialog'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'

export const ScriptDialog: React.FC = () => {
  const snap = useSnapshot(toolState)
  const scriptContent = getScriptToDisplay(snap)
  const { isCopied, handleCopyClick } = useCopyToClipboard(scriptContent)

  return (
    <BaseDialog
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
    </BaseDialog>
  )
}

function getScriptToDisplay(snapshot: {
  walletAddress: string
  walletAddressId: string
  currentToolType: string
  activeVersion: string
  cdnUrl: string
}): string {
  const {
    walletAddress,
    walletAddressId,
    currentToolType: toolType,
    activeVersion: preset,
    cdnUrl,
  } = snapshot

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
