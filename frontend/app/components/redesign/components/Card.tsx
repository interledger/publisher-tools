import React from 'react'

type CardProps = {
  children: React.ReactNode
  className?: string
}

export const Card = ({ children, className = '' }: CardProps) => {
  return (
    <div
      className={`
      bg-interface-bg-container 
      rounded-sm
      p-md
      gap-md
      flex flex-col
      ${className}
    `}
    >
      {children}
    </div>
  )
}
