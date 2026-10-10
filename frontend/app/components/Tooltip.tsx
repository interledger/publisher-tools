import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cx } from 'class-variance-authority'
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  arrow,
  type Placement,
} from '@floating-ui/react-dom'
import { SVGTooltip } from '~/assets/svg'

export interface TooltipProps {
  children: React.ReactNode
  content?: React.ReactNode
  label?: string
  placement?: Placement
  className?: string
}
const VIEWPORT_PADDING = 8
const ARROW_HEIGHT = 6

export function Tooltip({
  children,
  content,
  label,
  placement: placementProp = 'right',
  className,
}: TooltipProps) {
  const arrowRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)

  const { x, y, strategy, refs, middlewareData, placement } = useFloating({
    open,
    placement: placementProp,
    strategy: 'fixed',
    middleware: [
      offset(VIEWPORT_PADDING * 2),
      flip({
        fallbackPlacements: ['top', 'bottom', 'left', 'right'],
        padding: VIEWPORT_PADDING,
      }),
      shift({ padding: VIEWPORT_PADDING }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  })
  const { x: arrowX, y: arrowY } = middlewareData.arrow ?? {}

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const hasCustomTrigger = content !== undefined
  const tooltipContent = hasCustomTrigger ? content : children

  return (
    <>
      {hasCustomTrigger ? (
        <span
          ref={refs.setReference}
          aria-label={label}
          aria-describedby={open ? 'tooltip' : undefined}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          className={cx('inline-flex', className)}
        >
          {children}
        </span>
      ) : (
        <button
          ref={refs.setReference}
          type="button"
          aria-label={label || 'More information'}
          aria-describedby={open ? 'tooltip' : undefined}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          className={cx(
            'rounded-full hover:bg-gray-100 focus:outline-hidden focus:ring-1 focus:ring-primary-focus',
            className,
          )}
        >
          <SVGTooltip className="w-6 h-6" />
        </button>
      )}

      {open &&
        (typeof document !== 'undefined'
          ? createPortal(
              <div
                ref={refs.setFloating}
                id="tooltip"
                role="tooltip"
                style={{
                  position: strategy,
                  top: y ?? 0,
                  left: x ?? 0,
                }}
                className="pointer-events-none select-none z-50 p-md bg-interface-tooltip rounded-sm shadow-lg text-white text-xs sm:text-sm max-w-[450px] w-max"
              >
                {tooltipContent}

                <div
                  ref={arrowRef}
                  className="absolute w-4 h-4 bg-interface-tooltip rotate-45 pointer-events-none"
                  style={{
                    left: arrowX,
                    top: arrowY,
                    ...(placement.startsWith('top') && {
                      bottom: `-${ARROW_HEIGHT}px`,
                    }),
                    ...(placement.startsWith('bottom') && {
                      top: `-${ARROW_HEIGHT}px`,
                    }),
                    ...(placement.startsWith('right') && {
                      left: `-${ARROW_HEIGHT}px`,
                    }),
                    ...(placement.startsWith('left') && {
                      right: `-${ARROW_HEIGHT}px`,
                    }),
                  }}
                />
              </div>,
              document.body,
            )
          : null)}
    </>
  )
}
