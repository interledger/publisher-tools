import React from 'react'
import type { ButtonHTMLAttributes } from 'react'

interface PillTagButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'active'
  size?: 'sm' | 'md'
}

export const PillTagButton: React.FC<PillTagButtonProps> = ({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs leading-xs',
    md: 'px-sm py-2xs text-sm leading-sm'
  }

  const variantClasses = {
    default: `
      border-field-border
      text-text-placeholder
      hover:border-field-border-hover
      hover:text-text-primary
      focus:border-field-border-focus
      focus:text-text-primary
    `,
    active: `
      border-field-border-focus
      text-text-primary
      hover:border-field-border-focus
      hover:text-text-primary
    `
  }

  return (
    <button
      className={`
        relative
        rounded-full
        border
        bg-transparent
        font-normal
        transition-all duration-200
        
        /* Disabled state */
        disabled:opacity-50
        disabled:cursor-not-allowed
        disabled:hover:border-field-border
        disabled:hover:text-text-placeholder
        
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      <span className="relative z-10 whitespace-nowrap">{children}</span>
    </button>
  )
}

export default PillTagButton
