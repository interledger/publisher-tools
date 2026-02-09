import { ColorSelector } from '@/components'
import type { Background, TextColor } from '@shared/types'

export interface Props {
  backgroundColor?: Background
  textColor?: TextColor
  headlineColor?: TextColor
  themeColor?: Background
  onBackgroundColorChange: (color: Background) => void
  onTextColorChange: (color: TextColor) => void
  onHeadlineColorChange: (color: TextColor) => void
  onThemeColorChange: (color: Background) => void
}

export function OfferwallColorsSelector({
  backgroundColor,
  textColor,
  headlineColor,
  themeColor,
  onBackgroundColorChange,
  onTextColorChange,
  onHeadlineColorChange,
  onThemeColorChange,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
      <ColorSelector
        label="Background"
        value={backgroundColor}
        onChange={onBackgroundColorChange}
      />
      <ColorSelector
        label="Body text"
        value={textColor}
        onChange={onTextColorChange}
      />
      <ColorSelector
        label="Headline"
        value={headlineColor}
        onChange={onHeadlineColorChange}
      />
      <ColorSelector
        label="Theme"
        value={themeColor}
        onChange={onThemeColorChange}
      />
    </div>
  )
}
