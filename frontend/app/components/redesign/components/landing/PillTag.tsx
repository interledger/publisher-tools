import React from 'react'

export type PillTagProps = {
  children: React.ReactNode
  variant?: 'default' | 'active'
  className?: string
}

export const PillTag = ({
  children,
  variant = 'default',
  className = ''
}: PillTagProps) => {
  const textColorClass =
    variant === 'active' ? 'text-text-secondary' : 'text-text-helper'

  return (
    <div
      className={`relative rounded-full border border-landing-pill-border border-solid flex items-center justify-center px-sm py-2xs font-normal text-sm leading-sm whitespace-nowrap ${textColorClass} ${className}`}
    >
      {children}
    </div>
  )
}
