import React from 'react'
import { ToolsSecondaryButton } from './ToolsSecondaryButton'
import { SVGClose } from '~/assets/svg'
import { Heading5, BodyEmphasis } from '../Typography'

interface WalletOwnershipModalProps {
  isOpen?: boolean
  onClose?: () => void
  onConfirm?: () => void
  walletAddress?: string
  className?: string
}

export const WalletOwnershipModal: React.FC<WalletOwnershipModalProps> = ({
  isOpen = true,
  onClose,
  onConfirm,
  walletAddress = '',
  className = ''
}) => {
  if (!isOpen) {
    return null
  }

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
          aria-label="Close modal"
        >
          <SVGClose />
        </button>
      )}
      {/* Title */}
      <div className="text-center">
        <Heading5>Connecting to your wallet</Heading5>
        {walletAddress && (
          <div className="flex w-full justify-center text-center mt-2">
            <BodyEmphasis>{walletAddress}</BodyEmphasis>
          </div>
        )}
      </div>
      {/* Description */}
      <div className="text-center">
        <p className="text-base leading-md font-normal text-text-primary">
          We need to connect to your wallet for security & privacy reasons.
          <br /> Please note this process does not involve accessing or handling
          your funds.
        </p>
      </div>
      <div className="w-full">
        <ToolsSecondaryButton
          className="w-full flex items-center justify-center"
          onClick={onConfirm}
        >
          Confirm
        </ToolsSecondaryButton>
      </div>
    </div>
  )
}

export default WalletOwnershipModal
