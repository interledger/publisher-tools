import { useState } from 'react'
import { cx } from 'class-variance-authority'
import { SVGTooltip } from '../../../assets/svg'

export interface TooltipProps {
  children: React.ReactNode
  className?: string
}

export function Tooltip({ children, className }: TooltipProps) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className={cx('w-fit relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <SVGTooltip className="w-6 h-6" />
      {open && (
        <div className="absolute z-50 left-8 top-1/2 -translate-y-1/2 w-[485px] flex items-center justify-center gap-2.5 p-4 bg-interface-tooltip rounded-lg shadow-lg">
          <p className="flex-1 mt-[-1.00px]  text-white">{children}</p>
        </div>
      )}
    </div>
  )
}
