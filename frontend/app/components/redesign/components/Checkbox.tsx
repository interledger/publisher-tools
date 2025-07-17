import React from 'react'
import { cx } from 'class-variance-authority'
import { SVGCheck } from '../../../assets/svg'

export interface CheckboxProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  label?: string
  className?: string
  disabled?: boolean
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  onChange,
  label,
  className = '',
  disabled = false
}) => {
  const handleChange = () => {
    if (onChange && !disabled) {
      onChange(!checked)
    }
  }

  return (
    <label
      className={cx(
        'flex items-center gap-xs',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className
      )}
      onClick={disabled ? undefined : handleChange}
    >
      <div
        className={cx(
          'w-4 h-4 rounded flex items-center justify-center',
          checked
            ? 'bg-purple-300 border-purple-300'
            : 'bg-white border border-purple-300',
          !disabled && !checked && 'hover:border-purple-400'
        )}
      >
        {checked && <SVGCheck className="w-3 h-3" />}
      </div>
      {label && (
        <span className="text-sm leading-sm text-text-primary">{label}</span>
      )}
    </label>
  )
}

export default Checkbox
