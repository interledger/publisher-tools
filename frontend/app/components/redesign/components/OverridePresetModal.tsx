import React from 'react'
import { ToolsPrimaryButton } from './ToolsPrimaryButton'
import { ToolsSecondaryButton } from './ToolsSecondaryButton'
import { SVGClose } from '~/assets/svg'

interface OverridePresetModalProps {
  isOpen?: boolean
  onClose?: () => void
  onOverride?: () => void
  onAddWalletAddress?: () => void
  onKeepLocal?: () => void
  className?: string
}

export const OverridePresetModal: React.FC<OverridePresetModalProps> = ({
  isOpen = true,
  onClose,
  onOverride,
  onAddWalletAddress,
  onKeepLocal,
  className = ''
}) => {
  if (!isOpen) {
    return null
  }

  const handleOverride = () => {
    if (onOverride) {
      onOverride()
    }
  }

  return (
    <div
      className={`
        bg-interface-bg-container
        border border-interface-edge-container
        rounded-lg
        pt-[60px] pb-4 px-0
        flex flex-col items-center gap-6
        w-full max-w-[426px]
        relative
        ${className}
      `}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-6 h-6 text-text-primary hover:text-text-secondary transition-colors"
          aria-label="Close modal"
        >
          <SVGClose className="w-6 h-6" />
        </button>
      )}

      <div className="flex flex-row items-center justify-center px-0 w-full">
        <div className="text-center max-w-[394px]">
          <p className="text-base leading-md font-normal text-text-primary">
            We found saved configurations for this wallet address, but you have
            local modifications that haven&apos;t been saved.
          </p>
        </div>
      </div>

      <div className="w-full px-4 space-y-3">
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Warning: Loading the saved configurations will replace your
            current unsaved changes.
          </p>
        </div>
        <ToolsPrimaryButton
          className="w-full h-12 rounded-lg bg-[#56b7b5] hover:bg-[#4a9d9b] text-white"
          onClick={handleOverride}
        >
          Load saved configuration
        </ToolsPrimaryButton>
        {onKeepLocal && (
          <ToolsSecondaryButton
            className="w-full h-12 rounded-lg border border-[#8075b3] text-[#8075b3] hover:border-[#6d5a9e] hover:text-[#6d5a9e]"
            onClick={onKeepLocal}
          >
            Keep my local changes
          </ToolsSecondaryButton>
        )}
      </div>

      <div className="flex flex-row items-center justify-center px-0 w-full">
        <div className="text-center max-w-[394px]">
          <p className="text-base leading-md font-normal text-text-primary">
            Would you like to use a different wallet address?
          </p>
        </div>
      </div>

      <div className="w-full px-4">
        <ToolsSecondaryButton
          className="w-full h-12 rounded-lg border border-[#8075b3] text-[#8075b3] hover:border-[#6d5a9e] hover:text-[#6d5a9e]"
          onClick={onAddWalletAddress}
        >
          Add another wallet address
        </ToolsSecondaryButton>
      </div>
    </div>
  )
}

export default OverridePresetModal
