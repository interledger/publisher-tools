import React from 'react'
import { cx } from 'class-variance-authority'
import { SVGArrowCollapse, SVGGreenVector, SVGRefresh } from '@/assets'
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
          'flex gap-xs items-center cursor-pointer list-none',
          'transition-all duration-300 ease-in-out outline-nav-link-hover',
          isOpen ? 'px-2xs py-xs' : 'pl-md pr-2xs py-xs',
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
