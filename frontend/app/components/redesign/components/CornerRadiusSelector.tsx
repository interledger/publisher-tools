import React from 'react'
import { cx } from 'class-variance-authority'
import { CORNER_OPTION, type CornerType } from '@shared/types'

export interface CornerRadiusSelectorProps {
  value: CornerType
  onChange: (value: CornerType) => void
}

const options: Array<{ value: CornerType; label: string }> = [
  { label: 'No rounding', value: CORNER_OPTION.None },
  { label: 'Light rounding', value: CORNER_OPTION.Light },
  { label: 'Pill rounding', value: CORNER_OPTION.Pill }
]

export function CornerRadiusSelector({
  value,
  onChange
}: CornerRadiusSelectorProps) {
  return (
    <div className="flex max-xl:self-center items-start xl:flex-row flex-col gap-md">
      {options.map((option) => (
        <label
          className="flex flex-row flex-1 items-center gap-xs group"
          key={option.value}
        >
          <input
            type="radio"
            name="cornerRadius"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          <CustomRadioDot selected={value === option.value} />

          <span className="text-style-body-standard">{option.label}</span>
        </label>
      ))}
    </div>
  )
}

function CustomRadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      className={cx(
        'w-4 h-4 rounded-full flex items-center justify-center',
        selected ? 'text-purple-600' : 'text-purple-300',
        'border border-current',
        'group-focus-within:ring-2 group-focus-within:ring-offset-2 group-focus-within:ring-current'
      )}
    >
      {selected && <span className="w-2 h-2 rounded-full bg-current" />}
    </span>
  )
}
