import React from 'react'
import { cx } from 'class-variance-authority'

type CardProps = {
  children: React.ReactNode
  className?: string
}

export const Card = ({ children, className = '' }: CardProps) => {
  return (
    <div
      className={cx(
        'bg-interface-bg-container rounded-lg p-md gap-md flex flex-col',
        className,
      )}
    >
      {children}
    </div>
  )
}
