import React from 'react'

interface Props {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  ariaValueText: string
  id?: string
  step?: number
}

export const Slider: React.FC<Props> = ({
  value,
  min,
  max,
  onChange,
  ariaValueText,
  id,
  step = 1,
}) => (
  <div className="relative w-full group">
    <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-purple-100" />
    <div
      className="absolute top-1/2 size-6 -translate-y-1/2 rounded-full bg-white border-4 border-purple-300 pointer-events-none
        group-focus-within:ring-2 group-focus-within:border-purple-600 group-focus-within:ring-purple-600 group-focus-within:ring-offset-1 transition-all"
      style={{
        left: `calc(${((value - min) / (max - min)) * 100}% - 12px)`,
      }}
    />

    <input
      type="range"
      id={id}
      value={value}
      min={min}
      max={max}
      step={step}
      aria-valuetext={ariaValueText}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full opacity-0 cursor-pointer focus:outline-none"
    />
  </div>
)
