import { useState, useRef, useEffect, forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { cx } from 'class-variance-authority'
import { SVGDropdown, SVGArrowDropdown } from '../../../assets/svg'

export type DropdownOption = {
  label: string
  value: string
}

interface ToolsDropdownProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: DropdownOption[]
  label?: string
  error?: string
  helpText?: string
  onChange?: (value: string) => void
  required?: boolean
  defaultValue?: string
  placeholder?: string
}

export const ToolsDropdown = forwardRef<HTMLDivElement, ToolsDropdownProps>(
  (
    {
      options,
      label,
      error,
      helpText,
      onChange,
      required = false,
      defaultValue,
      placeholder = 'Select an option',
      disabled = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedOption, setSelectedOption] = useState<
      DropdownOption | undefined
    >(
      defaultValue
        ? options.find((opt) => opt.value === defaultValue)
        : undefined
    )
    const [isFocused, setIsFocused] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false)
          setIsFocused(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [])

    const handleOptionSelect = (option: DropdownOption) => {
      setSelectedOption(option)
      setIsOpen(false)
      if (onChange) {
        onChange(option.value)
      }
      if (inputRef.current) {
        inputRef.current.value = option.value
      }
    }

    const toggleDropdown = () => {
      if (!disabled) {
        setIsOpen(!isOpen)
        setIsFocused(true)
      }
    }

    return (
      <div ref={ref} className={cx('space-y-3xs', className)}>
        {label && (
          <label
            className={cx(
              'block text-xs leading-xs',
              error
                ? 'text-text-error'
                : isFocused
                  ? 'text-purple-600'
                  : 'text-silver-800'
            )}
          >
            {label}
            {required && <span className="text-text-error">*</span>}
          </label>
        )}

        <div ref={dropdownRef} className="relative">
          <input
            type="hidden"
            ref={inputRef}
            name={props.name}
            value={selectedOption?.value || ''}
          />

          <button
            type="button"
            onClick={toggleDropdown}
            className={cx(
              'flex items-center justify-between w-full h-12 px-md py-3 rounded-sm border',
              disabled
                ? 'bg-field-bg-disabled border-field-border-disabled cursor-not-allowed'
                : error
                  ? 'border-field-border-error'
                  : isFocused
                    ? 'border-field-border-focus'
                    : 'border-field-border hover:border-field-border-hover',
              'focus:outline-none'
            )}
            disabled={disabled}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          >
            <div className="flex items-center">
              <span className="flex items-center justify-center mr-xs">
                <SVGDropdown
                  className={cx(
                    'w-5 h-5',
                    disabled
                      ? 'fill-text-disabled'
                      : selectedOption
                        ? 'fill-text-primary'
                        : 'fill-text-placeholder'
                  )}
                />
              </span>

              <span
                className={cx(
                  'text-base leading-md',
                  disabled
                    ? 'text-text-disabled'
                    : selectedOption
                      ? 'text-text-primary'
                      : 'text-text-placeholder'
                )}
              >
                {selectedOption ? selectedOption.label : placeholder}
              </span>
            </div>

            <span
              className={cx(
                'flex items-center justify-center transition-transform duration-200',
                isOpen ? 'rotate-180' : ''
              )}
            >
              <SVGArrowDropdown
                className={cx(
                  'w-5 h-5',
                  disabled ? 'fill-text-disabled' : 'fill-text-primary'
                )}
              />
            </span>
          </button>

          {isOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-silver-200 rounded-sm shadow-sm">
              <ul className="p-xs" role="listbox">
                {options.map((option) => (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={selectedOption?.value === option.value}
                  >
                    <button
                      type="button"
                      onClick={() => handleOptionSelect(option)}
                      className={cx(
                        'w-full text-left px-md py-xs text-sm leading-5 text-text-primary hover:bg-purple-50 rounded-xs',
                        selectedOption?.value === option.value
                          ? 'font-medium'
                          : 'font-normal'
                      )}
                    >
                      {option.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-text-error">{error}</p>}
        {helpText && !error && (
          <p className="text-xs text-silver-800">{helpText}</p>
        )}
      </div>
    )
  }
)

ToolsDropdown.displayName = 'ToolsDropdown'
