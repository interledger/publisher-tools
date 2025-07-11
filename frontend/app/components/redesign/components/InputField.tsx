import type { InputHTMLAttributes } from 'react'
import { cx } from 'class-variance-authority'

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string | string[]
  helpText?: string
}

export function InputField({
  label,
  error,
  helpText,
  className = '',
  ...props
}: InputFieldProps) {
  return (
    <div className="space-y-2xs">
      {label && (
        <label className="block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <input
        className={cx(
          'w-full px-sm py-xs',
          'border rounded-sm',
          'text-text-primary placeholder:text-text-placeholder',
          'hover:border-field-border-hover',
          'focus:border-field-border-focus focus:outline-none focus:ring-1 focus:ring-primary-focus',
          'disabled:border-field-border-disabled disabled:bg-field-bg-disabled disabled:text-silver-700',
          error ? 'border-field-border-error' : 'border-field-border',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-text-error">{error}</p>}
      {helpText && !error && (
        <p className="text-xs text-text-secondary">{helpText}</p>
      )}
    </div>
  )
}
