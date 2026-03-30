import React from 'react'
import { cx } from 'class-variance-authority'
import { SVGArrowCollapse, SVGGreenVector } from '@/assets'
import { ToolsSecondaryButton, Divider } from '@/components'
import { Heading5 } from '@/typography'
import { GhostButton } from './GhostButton'

interface Props {
  title: string
  onRefresh: () => void
  onDone?: () => void
  isComplete?: boolean
  isOpen?: boolean
  onClick?: (isOpen: boolean) => void
  onToggle?: (e: React.SyntheticEvent<HTMLDetailsElement>) => void
  children: React.ReactNode
}

export const BuilderAccordion: React.FC<Props> = ({
  title,
  isComplete = false,
  isOpen = false,
  onClick,
  onRefresh,
  onDone,
  onToggle,
  children,
}) => {
  const handleSummaryClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
    onClick?.(!isOpen)
  }

  return (
    <details
      open={isOpen}
      className={cx(
        'flex flex-col rounded-lg relative',
        'transition-transform duration-300 ease-in-out',
        isOpen ? 'bg-interface-bg-container' : 'bg-interface-bg-main',
      )}
      onToggle={onToggle}
    >
      <summary
        onClick={handleSummaryClick}
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
              onClick={(e) => {
                e.stopPropagation()
                onRefresh()
              }}
              aria-label={`Reset ${title.toLowerCase()} to default`}
              className="text-xs sm:text-sm gap-xs"
            >
              Reset changes
            </GhostButton>
          )}
          {onDone && (
            <SVGArrowCollapse
              className={cx('w-12 h-12 p-3.5', !isOpen && 'rotate-180')}
            />
          )}
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
                onClick={onDone}
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
