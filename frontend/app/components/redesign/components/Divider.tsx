import React from 'react'

export const Divider: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={`w-full h-px bg-silver-200 my-md ${className}`}></div>
}

export default Divider
