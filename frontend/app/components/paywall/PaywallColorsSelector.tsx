import { ColorSelector } from '@/components'
import type { PaywallProfile } from '@shared/types'

type Color = PaywallProfile['colors']

export interface Props {
  backgroundColor?: Color['background']
  textColor?: Color['text']
  themeColor?: Color['theme']
  onBackgroundColorChange: (color: Color['background']) => void
  onTextColorChange: (color: Color['text']) => void
  onThemeColorChange: (color: Color['theme']) => void
}

export function PaywallColorsSelector({
  backgroundColor,
  textColor,
  themeColor,
  onBackgroundColorChange,
  onTextColorChange,
  onThemeColorChange,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
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
