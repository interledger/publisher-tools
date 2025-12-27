import React from 'react'
import { SVGMarkSuccess } from '~/assets/svg'
import { ToolsPrimaryButton } from './ToolsPrimaryButton'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'
import { BaseModal } from './modals/BaseModal'

interface ScriptReadyModalProps {
  isOpen?: boolean
  onClose?: () => void
  scriptContent: string
  className?: string
}

export const ScriptReadyModal: React.FC<ScriptReadyModalProps> = ({
  isOpen = true,
  scriptContent
}) => {
  const { isCopied, handleCopyClick } = useCopyToClipboard(scriptContent)

  if (!isOpen) return null

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

export default ScriptReadyModal
