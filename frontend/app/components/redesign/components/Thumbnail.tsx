import React from 'react'

export interface ThumbnailProps {
  isSelected: boolean
  imageUrl: string
  onClick: () => void
}

export const Thumbnail: React.FC<ThumbnailProps> = ({
  isSelected,
  imageUrl,
  onClick
}) => {
  return (
    <div
      className={`w-[100px] h-20 border rounded-lg flex items-center justify-center cursor-pointer ${
        isSelected ? 'border-purple-600' : 'border-silver-300'
      }`}
      onClick={onClick}
    >
      <img src={imageUrl} alt="Thumbnail" className="w-[50%] h-[45%]" />
    </div>
  )
}

export default Thumbnail
