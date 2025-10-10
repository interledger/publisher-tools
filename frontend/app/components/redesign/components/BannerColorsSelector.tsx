import { ColorSelector } from '@/components'
import { toolState } from '~/stores/toolStore'
import { useSnapshot } from 'valtio'

export interface BannerColorsSelectorProps {
  onBackgroundColorChange: (color: string) => void
  onTextColorChange: (color: string) => void
}

export function BannerColorsSelector({
  onBackgroundColorChange,
  onTextColorChange
}: BannerColorsSelectorProps) {
  const {
    currentConfig: { bannerBackgroundColor, bannerTextColor }
  } = useSnapshot(toolState)
  return (
    <div className="flex justify-between sm:flex-row flex-col gap-md">
      <ColorSelector
        label="Background"
        value={bannerBackgroundColor}
        onChange={onBackgroundColorChange}
      />
      <ColorSelector
        label="Text"
        value={bannerTextColor}
        onChange={onTextColorChange}
      />
      <div className="flex flex-row flex-1 items-center gap-xs pointer-events-none"></div>
    </div>
  )
}
