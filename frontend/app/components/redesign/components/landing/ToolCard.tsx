import React, { useId } from 'react'
import { Link } from 'react-router'
import { PillTag } from '@/components'
import arrowOutwardIcon from '~/assets/images/landing/arrow-outward.svg'

export type ToolCardProps = {
  children?: React.ReactNode
  title: string
  tags: string[]
  icon: string
  to: string
  target?: '_blank' | '_self' | '_parent' | '_top'
  className?: string
}

export const ToolCard = ({
  children,
  title,
  tags,
  icon,
  to,
  target,
  className = '',
}: ToolCardProps) => {
  const id = useId()
  const linkContent = title
  const linkClasses =
    'font-bold text-xl leading-normal text-text-primary after:absolute after:inset-0 after:z-10'
  const isExternalLink = target !== undefined

  return (
    <article
      className={`bg-interface-bg-main rounded-2xl w-full max-w-[330px] p-md pb-xl flex flex-col gap-md relative group hover:bg-white hover:cursor-pointer focus-within:bg-white ${className}`}
      aria-labelledby={`heading-${id}`}
      aria-describedby={`description-${id}`}
    >
      <img src={icon} alt="" className="h-[160px]" />

      <div className="flex flex-col gap-xs">
        <h2 id={`heading-${id}`}>
          {isExternalLink ? (
            <a
              href={to}
              target={target}
              rel={target === '_blank' ? 'noreferrer' : undefined}
              className={linkClasses}
            >
              {linkContent}
            </a>
          ) : (
            <Link to={to} className={linkClasses}>
              {linkContent}
            </Link>
          )}
        </h2>

        <p
          className="font-normal text-sm leading-sm text-text-primary"
          id={`description-${id}`}
        >
          {children}
        </p>

        <ul
          className="flex flex-wrap gap-xs list-none p-0 m-0"
          aria-label="Tags"
        >
          {tags.map((tag, index) => (
            <li key={index}>
              <PillTag variant="active">{tag}</PillTag>
            </li>
          ))}
        </ul>
      </div>

      <div className="absolute bottom-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
        <img
          src={arrowOutwardIcon}
          className="w-full h-full"
          aria-hidden="true"
        />
      </div>
    </article>
  )
}
