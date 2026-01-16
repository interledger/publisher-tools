import React from 'react'
import { ColorSelector } from '@/components'

export interface WidgetColorsSelectorProps {
  backgroundColor?: string
  textColor?: string
  buttonColor?: string
  onBackgroundColorChange: (color: string) => void
  onTextColorChange: (color: string) => void
  onButtonColorChange: (color: string) => void
}

export function WidgetColorsSelector({
  backgroundColor,
  textColor,
  buttonColor,
  onBackgroundColorChange,
  onTextColorChange,
  onButtonColorChange,
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
        label="Button"
        value={buttonColor}
        onChange={onButtonColorChange}
      />
    </div>
  )
}
