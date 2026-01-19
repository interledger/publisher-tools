import { useId, type InputHTMLAttributes, forwardRef } from 'react'
import { cx } from 'class-variance-authority'

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  id?: string
  error?: string | string[]
  helpText?: string
  ariaDescription?: string
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
      ariaDescription,
      showCounter = false,
      className = '',
      required,
      maxLength,
      currentLength,
      onBlur,
      onChange,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId()
    const fieldId = id || generatedId
    const ariaDescriptionId =
      ariaDescription && !error ? `${fieldId}-aria-desc` : undefined

    const getDisplayError = (): string | string[] | undefined => {
      if (required && !props.value) {
        return 'This field is required'
      }

      return error
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const trimmed = e.target.value.trim()
      if (trimmed !== e.target.value) {
        e.target.value = trimmed
        onChange?.(e)
      }

      onBlur?.(e)
    }

    const displayError = getDisplayError()
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
        <div className="relative">
          <input
            ref={ref}
            maxLength={maxLength}
            className={cx(
              'w-full px-sm py-xs rounded-sm',
              'text-text-primary placeholder:text-text-placeholder',
              'border hover:border-field-border-hover',
              'focus:border-field-border-focus focus:outline-none focus:ring-1 focus:ring-primary-focus',
              'disabled:border-field-border-disabled disabled:bg-field-bg-disabled disabled:text-silver-700',
              'placeholder-ellipsis placeholder:text-xs sm:placeholder:text-sm',
              error ? 'border-field-border-error' : 'border-field-border',
              className,
            )}
            id={fieldId}
            name={fieldId}
            aria-invalid={!!error}
            aria-describedby={displayError ? 'input-error' : ariaDescriptionId}
            onChange={onChange}
            onBlur={handleBlur}
            {...props}
          />
          {ariaDescription && !displayError && (
            <p id={ariaDescriptionId} className="sr-only">
              {ariaDescription}
            </p>
          )}

          {displayError && (
            <span
              id="input-error"
              role="alert"
              aria-live="polite"
              className="absolute right-3 top-full
              -translate-y-1/2
              px-1 text-xs text-text-error bg-white"
            >
              {displayError}
            </span>
          )}
        </div>
        {(helpText || showCounter) && !displayError && (
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
  },
)

InputField.displayName = 'InputField'
