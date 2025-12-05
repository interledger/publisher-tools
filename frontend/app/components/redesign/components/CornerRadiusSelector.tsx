import { CORNER_OPTION, type CornerType } from '@shared/types'
import { CustomRadioDot } from './CustomRadioDot'

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
