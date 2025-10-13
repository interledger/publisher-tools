import { Slider } from '@/components'
import { cx } from 'class-variance-authority'
import { useId } from 'react'

interface Props {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  label?: string
}

export function FontSizeInput({
  value,
  min,
  max,
  onChange,
  label = 'Size'
}: Props) {
  const id = useId()
  return (
    <div className="space-y-2xs" role="group" aria-labelledby={`label-${id}`}>
      <label className="text-xs leading-xs text-silver-700" id={`label-${id}`}>
        {label}
      </label>

      <div className="flex items-center h-12 gap-md">
        <IncDecButton
          label="Decrease font size"
          onClick={() => onChange(Math.max(min, (value ?? min) - 1))}
          aria-controls={id}
        >
          <IncDecIcon type="dec" />
        </IncDecButton>

        <Slider
          id={id}
          value={value ?? min}
          min={min}
          max={max}
          onChange={onChange}
        />

        <IncDecButton
          label="Increase font size"
          onClick={() => onChange(Math.min(max, (value ?? min) + 1))}
          aria-controls={id}
        >
          <IncDecIcon type="inc" />
        </IncDecButton>
      </div>
    </div>
  )
}

function IncDecButton({
  label,
  onClick,
  children
}: { label: string } & React.ComponentProps<'button'>) {
  return (
    <button
      className="flex items-center justify-center w-6 h-7 cursor-pointer"
      onClick={onClick}
    >
      <span className="sr-only">{label}</span>
      {children}
    </button>
  )
}

function IncDecIcon({ type }: { type: 'inc' | 'dec' }) {
  return (
    <span
      className={cx(
        'text-text-primary hover:font-bold',
        type === 'inc' ? 'text-3xl leading-3xl' : 'text-sm leading-sm'
      )}
      aria-hidden="true"
    >
      A
    </span>
  )
}
