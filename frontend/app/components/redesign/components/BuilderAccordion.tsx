import React, { useState, useEffect, useRef } from 'react'
import { SVGArrowCollapse, SVGGreenVector, SVGRefresh } from '@/assets'
import { GhostButton } from './GhostButton'
import { Heading5 } from '@/typography'
import { ToolsSecondaryButton, Divider } from '@/components'

interface BuilderAccordionProps {
  title: string
  onRefresh: () => void
  onDone: () => void
  isComplete?: boolean
  activeVersion?: string
  initialIsOpen?: boolean
  onToggle?: (isOpen: boolean) => void
  children: React.ReactNode
  className?: string
}

export const BuilderAccordion: React.FC<BuilderAccordionProps> = ({
  title,
  isComplete = false,
  activeVersion,
  initialIsOpen = false,
  onToggle,
  onRefresh,
  onDone,
  children,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(initialIsOpen)
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
    onRefresh()
  }

  const handleDoneClick = () => {
    setIsOpen(false)
    if (detailsRef.current) {
      detailsRef.current.open = false
    }

    onDone()
  }

  return (
    <details
      ref={detailsRef}
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

      {isOpen && (
        <GhostButton
          className="absolute top-2 right-14 w-12 h-12 z-10 p-0"
          onClick={handleRefresh}
          aria-label={`Reset ${title.toLowerCase()} to default`}
        >
          <SVGRefresh className="w-6 h-6" />
        </GhostButton>
      )}

      <div className="flex flex-col gap-sm mt-sm">
        {children}

        {isOpen && (
          <>
            <Divider />
            <div className="flex justify-end">
              <ToolsSecondaryButton
                className="w-full xl:w-[140px]"
                onClick={handleDoneClick}
              >
                Done
              </ToolsSecondaryButton>
            </div>
          </>
        )}
      </div>
    </details>
  )
}

export default BuilderAccordion
