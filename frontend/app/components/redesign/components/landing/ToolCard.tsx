import React from 'react'
import { PillTag } from './PillTag'
import arrowOutwardIcon from '~/assets/images/landing/arrow-outward.svg'

export type ToolCardProps = {
  children?: React.ReactNode
  title: string
  tags: string[]
  icon: string
}

export const ToolCard = ({ children, title, tags, icon }: ToolCardProps) => {
  return (
    <div className="bg-interface-bg-main rounded-2xl w-[340px] h-[397px] p-md flex flex-col gap-md relative group hover:bg-white hover:cursor-pointer">
      {<img src={icon} className="h-[160px]" />}

      <div className="flex flex-col gap-xs">
        <h3 className="font-bold text-xl leading-normal text-text-primary">
          {title}
        </h3>

        <p className="font-normal text-sm leading-sm text-text-primary">
          {children}
        </p>

        <div className="flex flex-wrap gap-xs">
          {tags.map((tag, index) => (
            <PillTag key={index} variant="active">
              {tag}
            </PillTag>
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <img src={arrowOutwardIcon} alt="Open tool" className="w-full h-full" />
      </div>
    </div>
  )
}
