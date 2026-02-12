import { ColorSelector } from '@/components'
import type { Background, TextColor } from '@shared/types'

export interface BannerColorsSelectorProps {
  backgroundColor?: Background
  textColor?: TextColor
  onBackgroundColorChange: (color: Background) => void
  onTextColorChange: (color: TextColor) => void
}

export function BannerColorsSelector({
  backgroundColor,
  textColor,
  onBackgroundColorChange,
  onTextColorChange,
}: BannerColorsSelectorProps) {
  return (
    <div className="flex justify-between sm:flex-row flex-col gap-md">
      <ColorSelector
        label="Background"
        value={backgroundColor}
        onChange={onBackgroundColorChange}
      />
      <ColorSelector
        label="Text"
        value={textColor}
        onChange={onTextColorChange}
      />
      <div className="flex flex-row flex-1 items-center gap-xs pointer-events-none"></div>
    </div>
  )
}
