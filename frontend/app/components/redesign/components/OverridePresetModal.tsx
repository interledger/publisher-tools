import React, { useState } from 'react'
import { ToolsPrimaryButton } from './ToolsPrimaryButton'
import { ToolsSecondaryButton } from './ToolsSecondaryButton'
import { SVGClose } from '~/assets/svg'

interface PresetOption {
  id: string
  name: string
  isSelected?: boolean
}

interface OverridePresetModalProps {
  isOpen?: boolean
  onClose?: () => void
  onOverride?: (selectedPresetId: string) => void
  onAddWalletAddress?: () => void
  presets?: PresetOption[]
  className?: string
}

export const OverridePresetModal: React.FC<OverridePresetModalProps> = ({
  isOpen = true,
  onClose,
  onOverride,
  onAddWalletAddress,
  presets = [
    { id: 'radu1', name: 'Radu 1', isSelected: true },
    { id: 'nice-banner', name: 'Nice banner', isSelected: false },
    { id: 'preset3', name: 'Preset 3 (no edits)', isSelected: false }
  ],
  className = ''
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    presets.find((p) => p.isSelected)?.id || presets[0]?.id || ''
  )

  if (!isOpen) {
    return null
  }

  const handleOverride = () => {
    if (selectedPresetId && onOverride) {
      onOverride(selectedPresetId)
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
          <SVGClose />
        </button>
      )}

      <div className="flex flex-row items-center justify-center px-0 w-full">
        <div className="text-center max-w-[394px]">
          <p className="text-base leading-md font-normal text-text-primary">
            We found edits correlated to this wallet address.
          </p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-base leading-md font-normal text-text-primary">
          Choose preset to override
        </p>
      </div>

      <div className="w-full px-4">
        <div className="flex flex-col gap-3">
          {presets.map((preset) => (
            <div key={preset.id} className="flex flex-row items-center gap-2">
              <button
                onClick={() => setSelectedPresetId(preset.id)}
                className="flex flex-row items-center justify-start p-1 rounded-full relative w-6 h-6"
                aria-label={`Select ${preset.name}`}
              >
                <div className="relative w-4 h-4">
                  {selectedPresetId === preset.id ? (
                    <div className="w-full h-full rounded-full border border-[#5b5380] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#5b5380]" />
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-full border border-[#8075b3]" />
                  )}
                </div>
              </button>
              <div className="text-sm leading-md font-bold text-text-primary whitespace-nowrap">
                {preset.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full px-4">
        <ToolsPrimaryButton
          className="w-full h-12 rounded-lg bg-[#56b7b5] hover:bg-[#4a9d9b] text-white"
          onClick={handleOverride}
        >
          Override and save
        </ToolsPrimaryButton>
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
