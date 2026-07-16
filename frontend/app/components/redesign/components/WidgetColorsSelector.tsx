import { ColorSelector } from '@/components'
import type { Background, TextColor } from '@shared/types'

export interface WidgetColorsSelectorProps {
  backgroundColor?: Background
  textColor?: TextColor
  themeColor?: Background
  onBackgroundColorChange: (color: Background) => void
  onTextColorChange: (color: TextColor) => void
  onThemeColorChange: (color: Background) => void
}

export function WidgetColorsSelector({
  backgroundColor,
  textColor,
  themeColor,
  onBackgroundColorChange,
  onTextColorChange,
  onThemeColorChange,
}: WidgetColorsSelectorProps) {
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
      <ColorSelector
        label="Theme"
        value={themeColor}
        onChange={onThemeColorChange}
      />
    </div>
  )
}
