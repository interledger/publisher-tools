import React from 'react'
import { GhostButton } from './GhostButton'
import { SVGArrowLeft } from '../../../assets/svg'
import { Heading1 } from '../Typography'

interface HeadingCoreProps {
  children: React.ReactNode
  title: string
  onBackClick?: () => void
  className?: string
}

export const HeadingCore: React.FC<HeadingCoreProps> = ({
  children,
  title,
  onBackClick,
  className = ''
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between xl:py-0 w-full mb-3xl gap-md xl:gap-0">
        <GhostButton onClick={onBackClick} className="xl:order-1">
          <SVGArrowLeft className="w-5 h-5" />
          All tools
        </GhostButton>

        <div className="xl:order-2">
          <Heading1 className="hidden xl:block">{title}</Heading1>
          <h2 className="block xl:hidden text-style-h2-semibold text-center">
            {title}
          </h2>
        </div>

        {/* Empty spacer to maintain center alignment on desktop */}
        <div className="hidden xl:block shrink-0 w-[100px] xl:order-3" />
      </div>

      <div className="text-center max-w-[1280px] mx-auto mb-3xl">
        <p className="text-base leading-md text-text-primary">{children}</p>
      </div>
    </div>
  )
}

export default HeadingCore
