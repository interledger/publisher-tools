import React, { useState } from 'react'
import { cx } from 'class-variance-authority'
import { SVGArrowCollapse, SVGGreenVector, SVGRefresh } from '@/assets'
import { GhostButton } from './GhostButton'
import { Heading5 } from '@/typography'
import { ToolsSecondaryButton, Divider } from '@/components'

interface BuilderAccordionProps {
  title: string
  onRefresh: () => void
  onDone: () => void
  isComplete?: boolean
  initialIsOpen?: boolean
  onToggle?: (isOpen: boolean) => void
  children: React.ReactNode
}

export const BuilderAccordion: React.FC<BuilderAccordionProps> = ({
  title,
  isComplete = false,
  initialIsOpen = false,
  onToggle,
  onRefresh,
  onDone,
  children
}) => {
  const [isOpen, setIsOpen] = useState(initialIsOpen)

  const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const isOpen = e.currentTarget.open
    setIsOpen(isOpen)
    onToggle?.(isOpen)
  }

  const handleDoneClick = () => {
    setIsOpen(false)
    onDone()
  }

  return (
    <details
      open={isOpen}
      name="builder-accordion"
      className={cx(
        'flex flex-col rounded-lg relative',
        'transition-transform duration-300 ease-in-out',
        isOpen ? 'bg-interface-bg-container' : 'bg-interface-bg-main'
      )}
      onToggle={handleToggle}
    >
      <summary
        className={cx(
          'flex gap-xs items-center cursor-pointer list-none',
          'transition-all duration-300 ease-in-out',
          isOpen ? 'px-2xs py-xs' : 'pl-md pr-2xs py-xs'
        )}
      >
        {isComplete && !isOpen && <SVGGreenVector className="w-6 h-[18px]" />}
        <Heading5>{title}</Heading5>

        <SVGArrowCollapse
          className={cx('w-12 h-12 p-3.5 ml-auto', !isOpen && 'rotate-180')}
        />
      </summary>

      {isOpen && (
        <GhostButton
          type="button"
          className="absolute top-2 right-14 w-12 h-12 z-10 p-0"
          onClick={onRefresh}
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
