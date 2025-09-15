import { useId, type InputHTMLAttributes, forwardRef } from 'react'
import { cx } from 'class-variance-authority'

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  id?: string
  error?: string | string[]
  helpText?: string
  showCounter?: boolean
  currentLength?: number
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      label,
      error,
      id,
      helpText,
      showCounter = false,
      className = '',
      required,
      maxLength,
      currentLength,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const fieldId = id || generatedId
    const displayError =
      required && !props.value ? 'This field is required' : error

    return (
      <div className="space-y-2xs">
        {label && (
          <label
            className="block text-sm font-medium text-text-primary"
            htmlFor={fieldId}
          >
            {label}
            {required && <span className="text-text-error ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={cx(
            'w-full px-sm py-xs rounded-sm',
            'text-text-primary placeholder:text-text-placeholder',
            'border hover:border-field-border-hover',
            'focus:border-field-border-focus focus:outline-none focus:ring-1 focus:ring-primary-focus',
            'disabled:border-field-border-disabled disabled:bg-field-bg-disabled disabled:text-silver-700',
            'placeholder-ellipsis placeholder:text-xs sm:placeholder:text-sm',
            error ? 'border-field-border-error' : 'border-field-border',
            className
          )}
          id={fieldId}
          name={fieldId}
          {...props}
        />
        {error && <p className="text-xs text-text-error">{displayError}</p>}
        {(helpText || showCounter) && !error && (
          <div className="flex justify-between gap-xs text-xs text-text-secondary">
            {helpText && <p>{helpText}</p>}
            {showCounter && maxLength && (
              <span>
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }
)

InputField.displayName = 'InputField'
