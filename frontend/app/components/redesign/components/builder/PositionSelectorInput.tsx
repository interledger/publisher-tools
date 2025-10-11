import { cx } from 'class-variance-authority'

export interface Option<T extends string> {
  label: string
  value: T
  icon: React.ReactElement
}

interface Props<T extends string> {
  value: T
  onChange: (value: T) => void
  options: Option<T>[]
}

export function PositionSelectorInput<T extends string>({
  value,
  onChange,
  options
}: Props<T>) {
  return (
    <div className="grid xl:grid-cols-3 max-xl:self-center items-start gap-md">
      {options.map((option) => (
        <label className="flex items-center gap-xs group" key={option.value}>
          <input
            type="radio"
            name="position"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          <CustomRadioDot selected={value === option.value} />
          {option.icon}
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
