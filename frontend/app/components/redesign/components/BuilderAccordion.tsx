import React, { useState, useEffect, useRef } from 'react'
import { SVGArrowCollapse, SVGGreenVector, SVGRefresh } from '@/assets'
import { GhostButton } from './GhostButton'
import { Heading5 } from '@/typography'

interface BuilderAccordionProps {
  title: string
  isComplete?: boolean
  activeVersion?: string
  onToggle?: (isOpen: boolean) => void
  onRefresh?: () => void
  children: React.ReactNode
  className?: string
}

export const BuilderAccordion: React.FC<BuilderAccordionProps> = ({
  title,
  isComplete = false,
  activeVersion,
  onToggle,
  onRefresh,
  children,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (wasOpenRef.current && detailsRef.current) {
      detailsRef.current.open = true
      setIsOpen(true)
    }
  }, [activeVersion])

  useEffect(() => {
    wasOpenRef.current = isOpen
  }, [isOpen])

  const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const isOpen = e.currentTarget.open
    setIsOpen(isOpen)
    onToggle?.(isOpen)
  }

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRefresh?.()
  }

  return (
    <details
      ref={detailsRef}
      key={activeVersion}
      name="builder-accordion"
      className={`flex flex-col rounded-lg transition-transform duration-300 ease-in-out relative ${
        isOpen ? 'bg-interface-bg-container' : 'bg-interface-bg-main'
      } ${className}`}
      onToggle={handleToggle}
    >
      <summary
        className={`flex items-center justify-between cursor-pointer transition-all duration-300 ease-in-out list-none ${
          isOpen ? 'px-2xs py-xs' : 'pl-md pr-2xs py-xs'
        }`}
      >
        <div className="flex items-center gap-xs">
          {isComplete && !isOpen && <SVGGreenVector className="w-6 h-[18px]" />}
          <Heading5>{title}</Heading5>
        </div>

        <div className="flex gap-xs">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              !isOpen ? 'rotate-180' : ''
            }`}
          >
            <SVGArrowCollapse className="w-5 h-5" />
          </div>
        </div>
      </summary>

      {isOpen && onRefresh && (
        <GhostButton
          className="absolute top-2 right-14 w-12 h-12 z-10 p-0"
          onClick={handleRefresh}
          aria-label={`Reset ${title.toLowerCase()} to default`}
        >
          <SVGRefresh className="w-6 h-6" />
        </GhostButton>
      )}

      <div className="flex flex-col gap-sm mt-sm">{children}</div>
    </details>
  )
}

export default BuilderAccordion
