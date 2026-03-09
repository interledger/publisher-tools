import React from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cx } from 'class-variance-authority'
import { SVGRefresh } from '~/assets/svg'

interface GhostButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  iconPosition?: 'left' | 'right' | 'none'
  icon?: 'restore'
  className?: string
}

export const GhostButton: React.FC<GhostButtonProps> = ({
  children,
  iconPosition = 'right',
  icon,
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
        'gap-sm',
        className,
      )}
      {...props}
    >
      {icon === 'restore' && iconPosition === 'left' && (
        <SVGRefresh className="w-5 h-5" />
      )}
      <span className="relative z-10 flex items-center gap-inherit">
        {children}
      </span>
    </button>
  )
}

export default GhostButton
