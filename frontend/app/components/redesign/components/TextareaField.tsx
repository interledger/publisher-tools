import { cx } from 'class-variance-authority'

interface TextareaFieldProps extends React.ComponentPropsWithRef<'textarea'> {
  label?: string
  error?: string
  helpText?: string
  showCounter?: boolean
  currentLength?: number
  maxLength?: number
}

export function TextareaField({
  label,
  error,
  helpText,
  showCounter = false,
  currentLength = 0,
  maxLength,
  className = '',
  ref,
  ...props
}: TextareaFieldProps) {
  return (
    <div className="space-y-2xs">
      {label && (
        <label className="block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cx(
          'w-full px-md py-sm',
          'border rounded-sm',
          'text-sm leading-sm text-text-primary placeholder:text-text-placeholder',
          'resize-none',
          'hover:border-field-border-hover',
          'focus:border-field-border-focus focus:outline-none focus:ring-1 focus:ring-primary-focus',
          'disabled:border-field-border-disabled disabled:bg-field-bg-disabled',
          error ? 'border-field-border-error' : 'border-field-border',
          className
        )}
        maxLength={maxLength}
        {...props}
      />
      <div className="flex justify-between gap-xs">
        {(helpText || error) && (
          <span
            className={cx(
              'text-xs leading-xs',
              error ? 'text-text-error' : 'text-text-secondary'
            )}
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
