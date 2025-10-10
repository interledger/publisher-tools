import { ColorSelector } from '@/components'
export interface BannerColorsSelectorProps {
  backgroundColor?: string
  textColor?: string
  onBackgroundColorChange: (color: string) => void
  onTextColorChange: (color: string) => void
}

export function BannerColorsSelector({
  backgroundColor,
  textColor,
  onBackgroundColorChange,
  onTextColorChange
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
