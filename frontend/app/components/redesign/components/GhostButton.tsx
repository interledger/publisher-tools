import React from 'react'
import { cx } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'

interface GhostButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
}

export const GhostButton: React.FC<GhostButtonProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <button
      className={cx(
        'flex flex-row items-center justify-center',
        'rounded-sm',
        'font-normal',
        'transition-all duration-200',
        'text-secondary-edge',
        'bg-transparent',
        'hover:text-secondary-edge-hover',
        'hover:bg-secondary-hover-surface',
        'px-xs py-sm',
        className
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-inherit">
        {children}
      </span>
    </button>
  )
}

export default GhostButton
