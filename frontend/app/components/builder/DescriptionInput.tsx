import { useId } from 'react'
import { cx } from 'class-variance-authority'
import { Toggle } from '../Toggle'

interface Props {
  label: string
  value: string
  onChange: (text: string) => void
  isVisible?: boolean
  onVisibilityChange?: (visible: boolean) => void
  maxLength: number
  placeholder: string
}

export function DescriptionInput({
  label,
  value,
  onChange,
  isVisible = true,
  onVisibilityChange,
  maxLength,
  placeholder,
}: Props) {
  const id = useId()
  const labelId = `${id}-label`

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className={cx(
        'rounded-lg border border-field-border overflow-hidden',
        'has-[textarea:focus]:border-field-border-focus has-[textarea:focus]:ring-1 has-[textarea:focus]:ring-primary-focus',
      )}
    >
      <div
        className={cx(
          'flex items-center justify-between gap-sm px-md py-xs bg-interface-bg-main',
        )}
      >
        <span
          id={labelId}
          className="text-sm leading-sm font-bold text-text-primary"
        >
          {label}
        </span>
        {onVisibilityChange && (
          <Toggle
            checked={isVisible}
            onChange={onVisibilityChange}
            label={`Show ${label.toLowerCase()}`}
            onText="Shown"
            offText="Hidden"
          />
        )}
      </div>

      {isVisible && (
        <div className="flex flex-col gap-2xs px-md pt-sm pb-xs">
          <textarea
            aria-labelledby={labelId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={maxLength}
            placeholder={placeholder}
            rows={9}
            className={cx(
              'w-full resize-none bg-transparent outline-hidden',
              'text-sm leading-sm text-text-primary placeholder:text-text-placeholder',
            )}
          />
          <div className="flex justify-between gap-xs text-xs leading-xs text-text-secondary">
            <span className="shrink-0">
              {value.length} / {maxLength}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
