import { cx } from 'class-variance-authority'
import React from 'react'
import {
  SVGScriptCode,
  SVGCopyScript,
  SVGCheckIcon,
  SVGLinkIcon,
  SVGShareScript
} from '@/assets'

interface ToolsPrimaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  iconPosition?: 'left' | 'right' | 'none'
  icon?: 'script' | 'copy' | 'link' | 'share' | 'check'
  className?: string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

export function ToolsPrimaryButton({
  children,
  iconPosition = 'right',
  icon,
  className,
  onClick,
  ...props
}: ToolsPrimaryButtonProps) {
  return (
    <button
      className={cx(
        'flex flex-row items-center justify-center',
        'bg-primary-bg hover:bg-primary-bg-hover',
        'text-white',
        'p-sm',
        'rounded-sm',
        'font-medium',
        'gap-2',
        'focus:outline-none focus:ring-2 focus:ring-primary-focus',
        'transition-colors duration-200',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {icon === 'script' && iconPosition === 'left' && (
        <SVGScriptCode className="w-5 h-5" />
      )}
      <span className="block font-normal leading-[24px] text-[16px] whitespace-pre">
        {children}
      </span>
      {icon === 'script' && iconPosition === 'right' && (
        <SVGScriptCode className="w-5 h-5" />
      )}
      {icon === 'copy' && iconPosition === 'right' && (
        <SVGCopyScript className="w-5 h-5" />
      )}
      {icon === 'link' && iconPosition === 'right' && (
        <SVGLinkIcon className="w-5 h-5" />
      )}
      {icon === 'share' && iconPosition === 'right' && (
        <SVGShareScript className="w-5 h-5" />
      )}
      {icon === 'check' && iconPosition === 'right' && (
        <SVGCheckIcon className="w-5 h-5" />
      )}
    </button>
  )
}
