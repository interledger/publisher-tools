import React from 'react'
import { ToolsPrimaryButton } from './ToolsPrimaryButton'
import { SVGMarkSuccess, SVGClose } from '~/assets/svg'

interface ScriptReadyModalProps {
  isOpen?: boolean
  onClose?: () => void
  scriptContent?: string
  onCopy?: () => void
  className?: string
}

export const ScriptReadyModal: React.FC<ScriptReadyModalProps> = ({
  isOpen = true,
  onClose,
  scriptContent = `<script id="wmt-init-script" type="module" src="https://cdn.webmonetization.org/init.js?wa=https://ilp.interledger-test.dev/e2bddaeb&tag=default&types=banner"></script>`,
  onCopy,
  className = ''
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(scriptContent)
    if (onCopy) {
      onCopy()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className={`
      bg-interface-bg-container
      border border-interface-edge-container
      rounded-lg
      p-8 pt-8 pb-4
      flex flex-col items-center gap-6
      w-full max-w-[442px]
      relative
      ${className}
    `}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-6 h-6 text-text-primary hover:text-text-secondary transition-colors"
          aria-label="Close"
        >
          <SVGClose />
        </button>
      )}
      <div className="flex items-center justify-center">
        <SVGMarkSuccess />
      </div>
      <div className="text-center">
        <p className="text-base leading-md font-normal text-text-primary">
          Your script is ready
        </p>
      </div>
      <div className="w-full bg-mint-50 border border-green-200 rounded-lg p-sm">
        <p className="text-sm leading-sm font-normal text-text-primary break-all">
          {scriptContent}
        </p>
      </div>
      <div className="w-full">
        <ToolsPrimaryButton
          icon="copy"
          iconPosition="right"
          className="w-full flex items-center justify-center"
          onClick={handleCopy}
        >
          Copy to clipboard
        </ToolsPrimaryButton>
      </div>
    </div>
  )
}

export default ScriptReadyModal
