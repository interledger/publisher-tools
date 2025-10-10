import { ColorSelector } from '@/components'
import { toolState } from '~/stores/toolStore'
import { useSnapshot } from 'valtio/react'

export interface WidgetColorsSelectorProps {
  onBackgroundColorChange: (color: string) => void
  onTextColorChange: (color: string) => void
  onButtonColorChange: (color: string) => void
}

export function WidgetColorsSelector({
  onBackgroundColorChange,
  onTextColorChange,
  onButtonColorChange
}: WidgetColorsSelectorProps) {
  const {
    currentConfig: {
      widgetBackgroundColor,
      widgetTextColor,
      widgetButtonBackgroundColor
    }
  } = useSnapshot(toolState)
  return (
    <div className="flex justify-between sm:flex-row flex-col gap-md">
      <ColorSelector
        label="Background"
        value={widgetBackgroundColor}
        onChange={onBackgroundColorChange}
      />
      <ColorSelector
        label="Text"
        value={widgetTextColor}
        onChange={onTextColorChange}
      />
      <ColorSelector
        label="Button"
        value={widgetButtonBackgroundColor}
        onChange={onButtonColorChange}
      />
    </div>
  )
}
