import React from 'react'
import { SVGScriptCode, SVGCopyScript } from '../../../assets/svg'

interface ToolsPrimaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  iconPosition?: 'left' | 'right' | 'none'
  icon?: 'script' | 'copy'
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
      className={` flex flex-row items-center
        bg-primary-bg hover:bg-primary-bg-hover 
        text-white 
        px-md py-sm 
        rounded-sm
        font-medium
        gap-2
        focus:outline-none focus:ring-2 focus:ring-primary-focus
        transition-colors duration-200
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {icon === 'script' && iconPosition === 'left' && <SVGScriptCode />}
      <span className="block font-normal leading-[24px] text-[16px] whitespace-pre">
        {children}
      </span>
      {icon === 'script' && iconPosition === 'right' && <SVGScriptCode />}
      {icon === 'copy' && iconPosition === 'right' && <SVGCopyScript />}
    </button>
  )
}
