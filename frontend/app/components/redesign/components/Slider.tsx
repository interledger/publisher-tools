import React from 'react'
import { cx } from 'class-variance-authority'

interface Props {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  id?: string
  className?: string
  step?: number
}

export const Slider: React.FC<Props> = ({
  value,
  min,
  max,
  onChange,
  id,
  className = '',
  step = 1
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value))
  }

  return (
    <div className={cx('relative w-full', className)}>
      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-purple-100" />
      <div
        className="absolute top-1/2 size-6 -translate-y-1/2 rounded-full bg-white border-4 border-purple-300 pointer-events-none"
        style={{
          left: `calc(${((value - min) / (max - min)) * 100}% - 12px)`
        }}
      />

      <input
        type="range"
        id={id}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        className="w-full opacity-0 cursor-pointer"
        aria-label={`Slider from ${min} to ${max}`}
      />
    </div>
  )
}
