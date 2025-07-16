import React from 'react'
import { GhostButton } from '@/components'
import { Heading1, Heading2SemiBold } from '@/typography'
import { SVGArrowLeft } from '@/assets'

interface HeadingCoreProps {
  children: React.ReactNode
  title: string
  onBackClick?: () => void
  className?: string
}

export const HeadingCore: React.FC<HeadingCoreProps> = ({
  children,
  title,
  onBackClick
}) => {
  return (
    <>
      <div
        id="header"
        className="flex flex-col pt-md pl-md pr-md gap-xs md:flex-row md:items-center md:justify-between md:py-0 md:px-0 md:pt-0 md:pb-0 w-full md:gap-0"
      >
        <GhostButton
          onClick={onBackClick}
          className="self-start md:order-1 md:self-auto"
        >
          <SVGArrowLeft className="w-5 h-5" />
          All tools
        </GhostButton>

        <div className="flex flex-col gap-3 items-center justify-start w-full md:order-2 md:w-auto">
          <Heading2SemiBold className="md:hidden text-center">
            {title}
          </Heading2SemiBold>
          <Heading1 className="hidden md:block text-center">{title}</Heading1>
        </div>

        {/* Empty spacer for desktop center alignment */}
        <div className="hidden md:block shrink-0 w-[100px] md:order-3" />
      </div>

      <div className="text-center max-w-[1280px] mx-auto mb-lg mt-lg md:mb-3xl md:mt-3xl">
        <p className="text-base leading-md text-text-primary">{children}</p>
      </div>
    </>
  )
}

export default HeadingCore
