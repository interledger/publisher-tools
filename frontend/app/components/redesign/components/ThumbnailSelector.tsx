import { useState, useEffect } from 'react'
import Checkbox from './Checkbox'
import Thumbnail from './Thumbnail'
import wmLogo from '~/assets/images/wm_logo_animated.svg?url'

interface ThumbnailSelectorProps {
  thumbnail: string
  onThumbnailChange: (value: string) => void
}

export function ThumbnailSelector({
  thumbnail,
  onThumbnailChange
}: ThumbnailSelectorProps) {
  const [isThumbnailVisible, setIsThumbnailVisible] = useState(() =>
    Boolean(thumbnail)
  )

  useEffect(() => {
    setIsThumbnailVisible(Boolean(thumbnail))
  }, [thumbnail])

  const thumbnails = [wmLogo]

  return (
    <>
      <Checkbox
        checked={isThumbnailVisible}
        onChange={(visible) => {
          setIsThumbnailVisible(visible)
          onThumbnailChange(visible ? 'default' : '')
        }}
        label="Visible"
      />
      <div className="flex gap-md">
        {thumbnails.map((thumbnail, index) => (
          <Thumbnail
            key={index}
            isSelected={true}
            imageUrl={thumbnail}
            onClick={() => {}}
          />
        ))}
      </div>
    </>
  )
}
