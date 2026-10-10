import React from 'react'
import { cx } from 'class-variance-authority'
import { SVGArrowCollapse, SVGGreenVector } from '@/assets'
import { Heading5 } from '@/typography'
import { useDialog } from '~/hooks/useDialog'
import { tooltips } from '~/lib/tooltips'
import { DiscardChangesDialog } from './dialogs/DiscardChangesDialog'
import { GhostButton } from './GhostButton'
import { Tooltip } from './Tooltip'

interface Props {
  title: string
  onRefresh: () => void
  isComplete?: boolean
  isOpen?: boolean
  onClick?: (isOpen: boolean) => void
  onToggle?: (e: React.SyntheticEvent<HTMLDetailsElement>) => void
  hasChanges?: boolean
  children: React.ReactNode
}

export const BuilderAccordion: React.FC<Props> = ({
  title,
  isComplete = false,
  isOpen = false,
  onClick,
  onRefresh,
  onToggle,
  hasChanges = false,
  children,
}) => {
  const [openDialog, closeDialog] = useDialog()

  const handleSummaryClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
    onClick?.(!isOpen)
  }

  const handleResetClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!hasChanges) return

    openDialog(
      <DiscardChangesDialog
        onCancel={closeDialog}
        onDiscard={() => {
          closeDialog()
          onRefresh()
        }}
      />,
    )
  }

  return (
    <details
      open={isOpen}
      className={cx(
        'flex flex-col rounded-sm relative',
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
            <div
              className="flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Tooltip
                content={tooltips.resetChanges}
                placement="top"
                label={`Reset ${title.toLowerCase()} to default`}
              >
                <GhostButton
                  icon="refresh"
                  iconPosition="left"
                  disabled={!hasChanges}
                  onClick={handleResetClick}
                  aria-label={`Reset ${title.toLowerCase()} to default`}
                  className="text-xs sm:text-sm gap-xs"
                >
                  Reset changes
                </GhostButton>
              </Tooltip>
            </div>
          )}
          {onClick && (
            <SVGArrowCollapse
              className={cx('w-[48px] h-[48px] p-sm', !isOpen && 'rotate-180')}
            />
          )}
        </div>
      </summary>

      <div className="relative z-10 flex flex-col gap-lg mt-sm mb-sm">
        {children}
      </div>
    </details>
  )
}

export default BuilderAccordion
