import { useState, useRef, useEffect } from 'react'
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  size,
  arrow
} from '@floating-ui/react-dom'
import { SVGTooltip } from '../../../assets/svg'

export interface TooltipProps {
  children: React.ReactNode
  label?: string
}
const MAX_TOOLTIP_WIDTH = 450
/** spacing between tooltip and viewport edges */
const VIEWPORT_PADDING = 8
const ARROW_HEIGHT = 6

export function Tooltip({ children, label }: TooltipProps) {
  const arrowRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)

  const { x, y, strategy, refs, middlewareData, placement } = useFloating({
    open,
    placement: 'right',
    middleware: [
      offset(VIEWPORT_PADDING * 2),
      flip({
        fallbackPlacements: ['top', 'bottom'],
        padding: VIEWPORT_PADDING
      }),
      shift({ padding: VIEWPORT_PADDING }),
      size({
        apply({ availableWidth, elements }) {
          const maxWidth = Math.min(availableWidth, MAX_TOOLTIP_WIDTH)
          Object.assign(elements.floating.style, {
            maxWidth: `${maxWidth}px`,
            width: 'auto'
          })
        },
        padding: VIEWPORT_PADDING
      }),
      arrow({ element: arrowRef })
    ],
    whileElementsMounted: autoUpdate
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

  return (
    <>
      <button
        ref={refs.setReference}
        type="button"
        aria-label={label || 'More information'}
        aria-describedby={open ? 'tooltip' : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="rounded-full hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-focus"
      >
        <SVGTooltip className="w-6 h-6" />
      </button>

      {open && (
        <div
          ref={refs.setFloating}
          id="tooltip"
          role="tooltip"
          style={{
            position: strategy,
            top: y,
            left: x
          }}
          className="relative z-50 p-md bg-interface-tooltip rounded-lg shadow-lg text-white text-xs sm:text-sm"
        >
          {children}

          <div
            ref={arrowRef}
            className="absolute w-4 h-4 bg-interface-tooltip rotate-45"
            style={{
              left: arrowX,
              top: arrowY,
              [{
                top: 'bottom',
                bottom: 'top',
                right: 'left',
                left: 'right'
              }[placement.split('-')[0]]!]: `-${ARROW_HEIGHT}px`
            }}
          />
        </div>
      )}
    </>
  )
}
