import React from 'react'
import { cx } from 'class-variance-authority'

export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Accessible name of the switch, e.g. "Show banner message" */
  label: string
  onText?: string
  offText?: string
  disabled?: boolean
  className?: string
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  onText,
  offText,
  disabled = false,
  className,
}) => {
  const stateText = checked ? onText : offText

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        'group flex items-center gap-xs rounded-full',
        'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-focus focus-visible:ring-offset-2',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className,
      )}
    >
      {stateText && (
        <span
          aria-hidden="true"
          className={cx(
            'text-sm leading-sm font-medium',
            checked ? 'text-green-600' : 'text-silver-800',
          )}
        >
          {stateText}
        </span>
      )}
      <span
        aria-hidden="true"
        className={cx(
          'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full',
          'transition-colors duration-200 motion-reduce:transition-none',
          checked ? 'bg-primary-bg' : 'bg-silver-400',
        )}
      >
        <span
          className={cx(
            'inline-block h-4 w-4 rounded-full bg-white shadow-sm',
            'transition-transform duration-200 motion-reduce:transition-none',
            checked ? 'translate-x-5' : 'translate-x-1',
          )}
        />
      </span>
    </button>
  )
}

export default Toggle
