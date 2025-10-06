import React from 'react'
import { cx } from 'class-variance-authority'

interface PillRadioListItemProps {
  radioGroup: string
  selected: boolean
  value: string
  children: React.ReactNode
  size?: 'sm' | 'md'
}

export const PillRadioListItem: React.FC<PillRadioListItemProps> = ({
  radioGroup,
  value,
  children,
  selected,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs leading-xs',
    md: 'px-sm py-2xs text-sm leading-sm'
  }

  const variantClasses = {
    default: [
      'border-field-border',
      'text-text-placeholder',
      'hover:border-field-border-hover',
      'hover:text-text-primary',
      'focus:border-field-border-focus',
      'focus:text-text-primary'
    ],
    active: [
      'border-field-border-focus',
      'text-text-primary',
      'hover:border-field-border-focus',
      'hover:text-text-primary'
    ]
  }

  return (
    <label
      className={cx(
        'relative',
        'rounded-full',
        'border',
        'bg-transparent',
        'cursor-pointer',
        'font-normal',
        'transition-all duration-200',
        selected && 'group-focus-within:ring',
        'disabled:opacity-50',
        'disabled:cursor-not-allowed',
        'disabled:hover:border-field-border',
        'disabled:hover:text-text-placeholder',
        sizeClasses[size],
        ...variantClasses[selected ? 'active' : 'default']
      )}
    >
      <span className="relative z-10 whitespace-nowrap">{children}</span>
      <input
        type="radio"
        name={radioGroup}
        defaultChecked={selected}
        value={value}
        className="sr-only"
      />
    </label>
  )
}

export default PillRadioListItem
