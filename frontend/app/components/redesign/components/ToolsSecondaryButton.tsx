import React from 'react'
import { cx } from 'class-variance-authority'
import { SVGPlay } from '~/assets/svg'

interface ToolsSecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  icon?: 'play'
  iconAlt?: string
  className?: string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

export function ToolsSecondaryButton({
  children,
  icon,
  className,
  onClick,
  ...props
}: ToolsSecondaryButtonProps) {
  return (
    <button
      type="button"
      className={cx(
        'flex flex-row items-center justify-center',
        'border border-secondary-edge hover:border-secondary-edge-hover',
        'text-secondary-edge hover:text-secondary-edge-hover',
        'hover:bg-secondary-hover-surface',
        'p-sm',
        'rounded-sm',
        'font-medium',
        'gap-2',
        'focus:outline-none focus:ring-2 focus:ring-primary-focus',
        'transition-all duration-200',
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {icon === 'play' && <SVGPlay className="w-5 h-5" />}
      <span className="font-normal leading-md text-base whitespace-pre">
        {children}
      </span>
    </button>
  )
}
