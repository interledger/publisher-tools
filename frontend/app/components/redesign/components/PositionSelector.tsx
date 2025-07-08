import React from 'react'
import { OptionSelector, type Option } from './OptionSelector'
import { PositionType } from '~/lib/types'

export interface PositionSelectorProps {
  defaultValue?: PositionType
  onChange?: (value: PositionType) => void
  className?: string
}

const PositionBottom = () => (
  <div className="w-11 h-11 border border-silver-200 rounded flex flex-col justify-between p-0.5">
    <div className="h-3 bg-transparent border border-silver-200 rounded-none" />
    <div className="h-3 bg-green-200 rounded-none" />
  </div>
)

const PositionTop = () => (
  <div className="w-11 h-11 border border-silver-200 rounded flex flex-col justify-between p-0.5">
    <div className="h-3 bg-green-200 rounded-none" />
    <div className="h-3 bg-transparent border border-silver-200 rounded-none" />
  </div>
)

const positionOptions: Option<PositionType>[] = [
  {
    id: 'position-bottom',
    label: 'Bottom',
    value: PositionType.Bottom,
    icon: <PositionBottom />
  },
  {
    id: 'position-top',
    label: 'Top',
    value: PositionType.Top,
    icon: <PositionTop />
  },
  {
    id: 'position-empty',
    label: '',
    value: PositionType.Top,
    icon: <div className="w-11 h-11 hidden xl:invisible" />
  }
]

export function PositionSelector({
  defaultValue = PositionType.Bottom,
  onChange,
  className
}: PositionSelectorProps) {
  return (
    <OptionSelector
      options={positionOptions}
      defaultValue={defaultValue}
      onChange={onChange}
      className={`xl:flex-row flex-col gap-md ${className}`}
    />
  )
}
