import React from 'react'
import { useSnapshot } from 'valtio'
import { SVGMarkSuccessSmall, SVGTooltip } from '@/assets'
import { ToolsPrimaryButton } from '@/components'
import { toWalletAddressUrl } from '@shared/utils'
import { toolState } from '~/stores/toolStore'
import { BaseDialog } from './BaseDialog'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'

interface ScriptAttribute {
  name: string
  value: string
}

export const ScriptDialog: React.FC = () => {
  const snap = useSnapshot(toolState)
  const attributes = getScriptAttributes(snap)
  const { isCopied, handleCopyClick } = useCopyToClipboard(
    toScriptHtml(attributes),
  )

  return (
    <BaseDialog
      className="pt-xl px-md pb-md flex flex-col items-center gap-md w-full max-w-[544px]"
      aria-labelledby="script-dialog-title"
    >
      <div className="flex gap-xs items-center justify-center">
        <SVGMarkSuccessSmall className="w-6 h-6" />
        <h2 className="text-style-body-emphasis">Your script is ready</h2>
      </div>

      <div className="flex gap-xs items-center px-sm py-0 w-full">
        <SVGTooltip className="w-6 h-6" />
        <p className="text-style-small-standard !text-field-helpertext-default text-center">
          Add the script to the <code className="font-mono">&lt;body&gt;</code>{' '}
          of your website.
          <br />
          Paste the script on the pages where you want the tool to be enabled
        </p>
      </div>

      <div
        className="bg-mint-50 w-full rounded-sm p-sm overflow-x-auto"
        role="region"
        aria-label="Script tag snippet"
      >
        <pre>
          <code className="font-['JetBrains_Mono'] text-[14px] leading-[1.5]">
            <span className="block">
              <span className="text-[#f97583]">{'<'}</span>
              <span className="text-silver-800">script</span>
            </span>
            {attributes.map((attr, index) => (
              <span key={index} className="block whitespace-pre">
                {'  '}
                <span className="text-silver-800">{attr.name}</span>
                <span className="text-[#f97583]">=</span>
                <span className="text-blue-600">{`"${attr.value}"`}</span>
              </span>
            ))}
            <span className="block">
              <span className="text-[#f97583]">{'>'}</span>
              <span className="text-silver-800">{'</'}</span>
              <span className="text-[#b392f0]">script</span>
              <span className="text-silver-800">{'>'}</span>
            </span>
          </code>
        </pre>
      </div>

      <div className="flex flex-col gap-md items-center w-full">
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

        <p className="text-style-small-standard text-text-primary text-center">
          View{' '}
          <a
            href={`https://webmonetization.org/publishers/${snap.currentToolType}-tool/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-primary-focus rounded"
          >
            Documentation
          </a>
        </p>
      </div>
    </BaseDialog>
  )
}

function getScriptAttributes(snapshot: {
  walletAddress: string
  walletAddressId: string
  currentToolType: string
  activeVersion: string
  cdnUrl: string
}): ScriptAttribute[] {
  const {
    walletAddress,
    walletAddressId,
    currentToolType: tool,
    activeVersion: profileId,
    cdnUrl,
  } = snapshot

  const wa = toWalletAddressUrl(walletAddress)
  const src = new URL(`/${tool}.js`, cdnUrl).href

  return [
    { name: 'id', value: `wmt-${tool}-init-script` },
    { name: 'type', value: 'module' },
    { name: 'src', value: src },
    {
      name: 'data-wallet-address',
      value: walletAddressId && wa !== walletAddressId ? walletAddressId : wa,
    },
    { name: 'data-tag', value: profileId },
  ]
}

function toScriptHtml(attributes: ScriptAttribute[]): string {
  const attrLines = attributes
    .map((attr) => `${attr.name}="${attr.value}"`)
    .join(' ')
  return `<script ${attrLines}></script>`
}
