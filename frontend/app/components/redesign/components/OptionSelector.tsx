import type { ReactNode } from 'react'
import { cx } from 'class-variance-authority'

export interface Option<T = string> {
  id: string
  label: string
  value: T
  icon?: ReactNode
}

export interface OptionSelectorProps<T = string> {
  className?: string
  options: Option<T>[]
  defaultValue?: T
  onChange?: (value: T) => void
  renderCustomOption?: (option: Option<T>, isSelected: boolean) => ReactNode
}

export function OptionSelector<T extends string | number>({
  className,
  options,
  defaultValue,
  onChange,
  renderCustomOption,
}: OptionSelectorProps<T>) {
  const handleChange = (value: T) => {
    if (onChange) {
      onChange(value)
    }
  }

  return (
    <div
      className={cx('flex flex-row max-xl:self-center items-start', className)}
    >
      {options.map((option) => {
        const isSelected = defaultValue === option.value

        if (renderCustomOption) {
          return (
            <div
              key={option.id}
              onClick={() => handleChange(option.value)}
              className="cursor-pointer"
            >
              {renderCustomOption(option, isSelected)}
            </div>
          )
        }

        return (
          <div
            key={option.id}
            className={cx(
              'flex flex-row flex-1 items-center gap-xs',
              option.label ? 'cursor-pointer' : 'pointer-events-none',
            )}
            onClick={() => option.label && handleChange(option.value)}
          >
            {option.label && (
              <button
                type="button"
                className={cx(
                  'w-4 h-4 rounded-full flex items-center justify-center border',
                  isSelected ? 'border-purple-600' : 'border-purple-300',
                )}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-purple-600" />
                )}
              </button>
            )}

            {option.icon && <div>{option.icon}</div>}
            {option.label && (
              <span className="text-style-body-standard">{option.label}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
