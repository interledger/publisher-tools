import React from 'react'
import { cx } from 'class-variance-authority'

export interface SliderProps {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  id?: string
  className?: string
  step?: number
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  onChange,
  id,
  className = '',
  step = 1
}) => {
  const handleSliderInteraction = (clientX: number, sliderRect: DOMRect) => {
    const percentage = Math.max(
      0,
      Math.min(1, (clientX - sliderRect.left) / sliderRect.width)
    )
    const rawValue = min + percentage * (max - min)
    const newValue = step > 0 ? Math.round(rawValue / step) * step : rawValue

    if (newValue !== value) {
      onChange(newValue)
    }
    return newValue
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const sliderRect = e.currentTarget.getBoundingClientRect()

    handleSliderInteraction(e.clientX, sliderRect)

    const handleMove = (moveEvent: MouseEvent) => {
      handleSliderInteraction(moveEvent.clientX, sliderRect)
    }

    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }

  return (
    <div
      className={cx(
        'relative h-6 w-full flex items-center cursor-pointer',
        className
      )}
      // TODO: use `input[type=range]` instead
      id={id}
      onMouseDown={handleMouseDown}
    >
      <div className="absolute h-1.5 w-full bg-purple-100 rounded-full"></div>

      <div
        className="absolute h-1.5 bg-purple-300 rounded-full"
        style={{
          width: `${((value - min) / (max - min)) * 100}%`,
          left: 0
        }}
      ></div>

      <div
        className="absolute h-6 w-6 rounded-full bg-white border-4 border-purple-300 cursor-grab active:cursor-grabbing"
        style={{
          left: `${((value - min) / (max - min)) * 100}%`,
          transform: 'translateX(-50%)'
        }}
      ></div>
    </div>
  )
}

export default Slider
