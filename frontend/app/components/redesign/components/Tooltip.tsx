import { useState } from 'react'
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  size
} from '@floating-ui/react-dom'
import { SVGTooltip } from '../../../assets/svg'

export interface TooltipProps {
  children: React.ReactNode
}

export function Tooltip({ children }: TooltipProps) {
  const [open, setOpen] = useState(false)

  const { x, y, strategy, refs } = useFloating({
    open,
    placement: 'right',
    middleware: [
      offset(8),
      flip({
        fallbackPlacements: ['top', 'bottom'],
        padding: 8
      }),
      shift({ padding: 8 }),
      size({
        apply({ availableWidth, elements }) {
          const maxWidth = Math.min(availableWidth, 450)
          Object.assign(elements.floating.style, {
            maxWidth: `${maxWidth}px`,
            width: 'auto'
          })
        },
        padding: 8
      })
    ],
    whileElementsMounted: autoUpdate
  })

  return (
    <>
      <button
        ref={refs.setReference}
        type="button"
        aria-label="More information"
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
          className="z-50 p-md bg-interface-tooltip rounded-lg shadow-lg text-white text-xs sm:text-sm"
        >
          {children}
        </div>
      )}
    </>
  )
}
