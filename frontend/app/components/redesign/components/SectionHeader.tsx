import React from 'react'
import type { ReactElement } from 'react'
import { cx } from 'class-variance-authority'

export interface SectionHeaderProps {
  icon: ReactElement
  label: string
  className?: string
  preserveWhitespace?: boolean
}

export function SectionHeader({
  icon,
  label,
  className,
  preserveWhitespace = true
}: SectionHeaderProps) {
  return (
    <div className={cx('flex flex-row items-center gap-1', className)}>
      <div className="relative size-5">{icon}</div>
      <div className="text-style-caption-emphasis">
        <p className={preserveWhitespace ? 'whitespace-pre' : undefined}>
          {label}
        </p>
      </div>
    </div>
  )
}
