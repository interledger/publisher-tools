import { useState } from 'react'
import { Checkbox, Thumbnail } from '@/components'
import wmLogo from '~/assets/images/wm_logo_animated.svg?url'

interface BannerThumbnailSelectorProps {
  thumbnail: string
  onVisibilityChange: (visible: boolean) => void
}

export function BannerThumbnailSelector({
  thumbnail,
  onVisibilityChange
}: BannerThumbnailSelectorProps) {
  const thumbnails = [wmLogo]
  const [selectedThumbnail, setSelectedThumbnail] = useState(0)
  const isVisible = Boolean(thumbnail)

  return (
    <div className="flex gap-md xl:flex-row flex-col xl:items-center items-start">
      <Checkbox
        checked={isVisible}
        onChange={onVisibilityChange}
        label="Visible"
      />
      <div className="flex gap-md">
        {thumbnails.map((thumbnail, index) => (
          <Thumbnail
            key={index}
            isSelected={selectedThumbnail === index}
            imageUrl={thumbnail}
            onClick={() => setSelectedThumbnail(index)}
          />
        ))}
      </div>
    </div>
  )
}
