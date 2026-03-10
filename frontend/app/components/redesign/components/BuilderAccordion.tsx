import React, { useState } from 'react'
import { cx } from 'class-variance-authority'
import { SVGArrowCollapse, SVGGreenVector } from '@/assets'
import { ToolsSecondaryButton, Divider } from '@/components'
import { Heading5 } from '@/typography'
import { GhostButton } from './GhostButton'

interface BuilderAccordionProps {
  title: string
  onRefresh: () => void
  onDone?: () => void
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
  children,
}) => {
  const [isOpen, setIsOpen] = useState(initialIsOpen)

  const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const isOpen = e.currentTarget.open
    setIsOpen(isOpen)
    onToggle?.(isOpen)
  }

  return (
    <details
      open={isOpen}
      name="builder-accordion"
      className={cx(
        'flex flex-col rounded-lg relative',
        'transition-transform duration-300 ease-in-out',
        isOpen ? 'bg-interface-bg-container' : 'bg-interface-bg-main',
      )}
      onToggle={handleToggle}
    >
      <summary
        className={cx(
          'flex items-center justify-between cursor-pointer list-none',
          'transition-all duration-300 ease-in-out outline-nav-link-hover',
          isOpen ? 'pr-2xs py-xs' : 'pl-md pr-2xs py-xs',
        )}
      >
        <div className="flex gap-xs items-center">
          {isComplete && !isOpen && <SVGGreenVector className="w-6 h-[18px]" />}
          <Heading5>{title}</Heading5>
        </div>

        <div className="flex gap-xs items-center">
          {isOpen && (
            <GhostButton
              icon="refresh"
              iconPosition="left"
              onClick={onRefresh}
              aria-label={`Reset ${title.toLowerCase()} to default`}
            >
              Back to default
            </GhostButton>
          )}
          <SVGArrowCollapse
            className={cx('w-12 h-12 p-3.5', !isOpen && 'rotate-180')}
          />
        </div>
      </summary>

      <div className="relative z-10 flex flex-col gap-lg mt-sm">{children}</div>
      {isOpen && (
        <>
          <Divider />
          {onDone && (
            <div className="flex justify-end">
              <ToolsSecondaryButton
                className="w-full xl:w-[140px]"
                onClick={() => {
                  setIsOpen(false)
                  onDone()
                }}
              >
                Done
              </ToolsSecondaryButton>
            </div>
          )}
        </>
      )}
    </details>
  )
}

export default BuilderAccordion
