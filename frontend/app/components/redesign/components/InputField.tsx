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
  addonBefore?: React.ReactNode
  addonAfter?: React.ReactNode
  addonClassName?: string
  labelClassName?: string
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
      addonBefore,
      addonAfter,
      addonClassName,
      labelClassName = 'text-sm font-medium text-text-primary',
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
          <label className={cx('block', labelClassName)} htmlFor={fieldId}>
            {label}
            {required && <span className="text-text-error ml-1">*</span>}
          </label>
        )}
        <div
          className={cx(
            'relative flex items-center flex-nowrap',
            'w-full px-sm py-xs rounded-sm',
            'border',
            !props.disabled &&
              'focus-within:border-field-border-focus focus-within:outline-none focus-within:ring-1 focus-within:ring-primary-focus hover:border-field-border-hover',
            error ? 'border-field-border-error' : 'border-field-border',
            props.disabled &&
              'border-field-border-disabled bg-field-bg-disabled text-silver-700',
            className,
          )}
        >
          {addonBefore && (
            <span
              className={cx('text-text-placeholder mr-1', addonClassName)}
              onClick={() => document.getElementById(fieldId)?.focus()}
            >
              {addonBefore}
            </span>
          )}
          <input
            ref={ref}
            maxLength={maxLength}
            className={cx(
              'outline-none border-none ring-0 focus:ring-0 focus:outline-none focus:border-none',
              'w-full',
              'text-text-primary bg-inherit',
              'placeholder:text-text-placeholder placeholder-ellipsis placeholder:text-xs sm:placeholder:text-sm',
            )}
            id={fieldId}
            name={fieldId}
            aria-invalid={!!error}
            aria-describedby={displayError ? 'input-error' : ariaDescriptionId}
            onChange={onChange}
            onBlur={handleBlur}
            {...props}
          />
          {addonAfter && (
            <span
              className={cx('text-text-placeholder ml-1', addonClassName)}
              onClick={() => document.getElementById(fieldId)?.focus()}
            >
              {addonAfter}
            </span>
          )}

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
