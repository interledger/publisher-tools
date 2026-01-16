import React from 'react'
import { BodyStandard } from '@/typography'

interface BodyStandardLinkProps {
  href: string
  children: React.ReactNode
  target?: '_blank' | '_self' | '_parent' | '_top'
  rel?: string
  className?: string
}

export const BodyStandardLink = ({
  href,
  children,
  target = '_blank',
  rel = 'noreferrer',
  className = '',
}: BodyStandardLinkProps) => {
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={`hover:opacity-70 transition-opacity ${className}`}
    >
      <BodyStandard>{children}</BodyStandard>
    </a>
  )
}
