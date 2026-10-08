import React from 'react'
import { cx } from 'class-variance-authority'

export const Divider: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cx('w-full h-px bg-silver-200 my-md', className)}></div>
  )
}

export default Divider
