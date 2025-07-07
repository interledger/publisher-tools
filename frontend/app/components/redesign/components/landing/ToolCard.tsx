import React from 'react'
import { Link } from '@remix-run/react'
import { PillTag } from './PillTag'
import arrowOutwardIcon from '~/assets/images/landing/arrow-outward.svg'

export type ToolCardProps = {
  children?: React.ReactNode
  title: string
  tags: string[]
  icon: string
  to: string
}

export const ToolCard = ({
  children,
  title,
  tags,
  icon,
  to
}: ToolCardProps) => {
  return (
    <Link
      to={to}
      className="bg-interface-bg-main rounded-2xl w-[340px] max-w-full h-[397px] p-md flex flex-col gap-md relative group hover:bg-white hover:cursor-pointer no-underline"
    >
      {<img src={icon} className="h-[160px]" />}

      <div className="flex flex-col gap-xs">
        <h3 className="font-bold text-xl leading-normal text-text-primary">
          {title}
        </h3>

        <p className="font-normal text-sm leading-sm text-text-primary">
          {children}
        </p>

        <ul className="flex flex-wrap gap-xs list-none p-0 m-0">
          {tags.map((tag, index) => (
            <li key={index}>
              <PillTag variant="active">{tag}</PillTag>
            </li>
          ))}
        </ul>
      </div>

      <div className="absolute bottom-4 right-4 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <img src={arrowOutwardIcon} className="w-full h-full" />
      </div>
    </Link>
  )
}
