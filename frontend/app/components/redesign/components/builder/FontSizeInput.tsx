import { useId } from 'react'
import { cx } from 'class-variance-authority'
import { Slider } from '@/components'
import type { FontSize } from '@shared/types'

interface Props<T extends FontSize> {
  value: T
  sizeMap: Record<T, number>
  onChange: (value: T) => void
  label?: string
}

export function FontSizeInput<T extends FontSize>({
  value,
  sizeMap,
  onChange,
  label = 'Size',
}: Props<T>) {
  const id = useId()

  const sizes = Object.keys(sizeMap) as T[]
  const index = sizes.indexOf(value)
  const sliderValue = index >= 0 ? index : 0
  const min = 0
  const max = sizes.length - 1

  const handleSliderChange = (index: number) => {
    const clampedIndex = Math.max(min, Math.min(max, index))
    onChange(sizes[clampedIndex])
  }

  const ariaSize = `${sizeMap[sizes[sliderValue]]}px`

  return (
    <div className="space-y-2xs" role="group" aria-labelledby={`label-${id}`}>
      <label
        className="text-xs leading-xs text-silver-700"
        htmlFor={id}
        id={`label-${id}`}
      >
        {label}
      </label>

      <div className="flex items-center h-12 gap-md">
        <IncDecButton
          label={'Decrease font size, currently'}
          onClick={() => handleSliderChange(sliderValue - 1)}
          aria-controls={id}
        >
          <IncDecIcon type="dec" />
        </IncDecButton>

        <Slider
          id={id}
          value={sliderValue}
          min={min}
          max={max}
          onChange={handleSliderChange}
          ariaValueText={ariaSize}
        />

        <IncDecButton
          label={'Increase font size, currently'}
          onClick={() => handleSliderChange(sliderValue + 1)}
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
  children,
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
        type === 'inc' ? 'text-3xl leading-3xl' : 'text-sm leading-sm',
      )}
      aria-hidden="true"
    >
      A
    </span>
  )
}
