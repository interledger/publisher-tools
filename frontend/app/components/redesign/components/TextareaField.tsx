import type { TextareaHTMLAttributes } from 'react'

interface TextareaFieldProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helpText?: string
  showCounter?: boolean
  maxLength?: number
}

export function TextareaField({
  label,
  error,
  helpText,
  showCounter = false,
  maxLength,
  className = '',
  value = '',
  ...props
}: TextareaFieldProps) {
  const currentLength = typeof value === 'string' ? value.length : 0

  return (
    <div className="space-y-2xs">
      {label && (
        <label className="block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-md py-sm
          border ${error ? 'border-field-border-error' : 'border-field-border'}
          hover:border-field-border-hover
          focus:border-field-border-focus focus:outline-none focus:ring-1 focus:ring-primary-focus
          disabled:border-field-border-disabled disabled:bg-field-bg-disabled
          rounded-sm
          text-sm leading-sm text-text-primary placeholder:text-text-placeholder
          resize-none
          ${className}
        `}
        value={value}
        maxLength={maxLength}
        {...props}
      />
      <div className="flex items-center justify-between">
        {(helpText || error) && (
          <span
            className={`text-xs leading-xs ${error ? 'text-text-error' : 'text-text-secondary'}`}
          >
            {error || helpText}
          </span>
        )}
        {showCounter && maxLength && (
          <span className="text-xs leading-xs text-text-secondary">
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
    </div>
  )
}
