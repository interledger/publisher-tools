import { cx } from 'class-variance-authority'
import React from 'react'

export type TextStyleType =
  | 'h1'
  | 'h2'
  | 'h2-semibold'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'body-standard'
  | 'body-emphasis'
  | 'small-standard'
  | 'small-emphasis'
  | 'caption-standard'
  | 'caption-emphasis'

type TypographyProps = {
  variant: TextStyleType
  as?: React.ElementType
  className?: string
  children: React.ReactNode
} & React.HTMLAttributes<HTMLElement>

export function Typography({
  variant,
  as,
  className,
  children,
  ...props
}: TypographyProps & React.HTMLAttributes<HTMLElement>) {
  const Component = as || getDefaultElementForVariant(variant)

  return (
    <Component className={cx(`text-style-${variant}`, className)} {...props}>
      {children}
    </Component>
  )
}

function getDefaultElementForVariant(
  variant: TextStyleType
): React.ElementType {
  switch (variant) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return variant
    case 'h2-semibold':
      return 'h2'
    case 'body-standard':
    case 'body-emphasis':
      return 'p'
    case 'small-standard':
    case 'small-emphasis':
      return 'span'
    case 'caption-standard':
    case 'caption-emphasis':
      return 'span'

    default:
      return 'span'
  }
}

export const Heading1 = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="h1" {...props} />
)

export const Heading2 = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="h2" {...props} />
)

export const Heading2SemiBold = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="h2-semibold" {...props} />
)

export const Heading3 = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="h3" {...props} />
)

export const Heading4 = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="h4" {...props} />
)

export const Heading5 = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="h5" {...props} />
)

export const Heading6 = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="h6" {...props} />
)

export const BodyStandard = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="body-standard" {...props} />
)

export const BodyEmphasis = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="body-emphasis" {...props} />
)

export const SmallStandard = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="small-standard" {...props} />
)

export const SmallEmphasis = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="small-emphasis" {...props} />
)

export const CaptionEmphasis = (props: Omit<TypographyProps, 'variant'>) => (
  <Typography variant="caption-emphasis" {...props} />
)
