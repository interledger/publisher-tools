import { useState, useId } from 'react'
import { cx } from 'class-variance-authority'
import { SVGTooltip } from '../../../assets/svg'

export interface TooltipProps {
  children: React.ReactNode
  className?: string
}

export function Tooltip({ children, className }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const tooltipId = useId()

  return (
    <div className={cx('w-fit relative inline-flex', className)}>
      <button
        type="button"
        aria-label="More information"
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(!open)}
        className="rounded-full hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-focus"
      >
        <SVGTooltip className="w-6 h-6" />
      </button>

      {open && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute z-50 left-8 top-1/2 -translate-y-1/2 w-[485px] flex items-center justify-center gap-2.5 p-4 bg-interface-tooltip rounded-lg shadow-lg"
        >
          <p className="text-white text-sm leading-relaxed">{children}</p>
        </div>
      )}
    </div>
  )
}
