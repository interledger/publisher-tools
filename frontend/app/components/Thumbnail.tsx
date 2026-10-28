import React from 'react'

export interface ThumbnailProps {
  isSelected: boolean
  imageUrl: string
  onClick: () => void
}

export const Thumbnail: React.FC<ThumbnailProps> = ({
  isSelected,
  imageUrl,
  onClick,
}) => {
  return (
    <div
      className={`w-[100px] h-[80px] border rounded-lg flex items-center justify-center cursor-pointer ${
        isSelected ? 'border-purple-600' : 'border-silver-300'
      }`}
      onClick={onClick}
    >
      <img
        src={imageUrl}
        alt="Thumbnail"
        className="max-h-[70%] max-w-[70%] object-contain"
      />
    </div>
  )
}

export default Thumbnail
