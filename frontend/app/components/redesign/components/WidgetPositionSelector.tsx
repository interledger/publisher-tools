import React from 'react'
import { cx } from 'class-variance-authority'
import { OptionSelector, type Option } from './OptionSelector'
import { PositionType } from '@shared/types'
import { SVGPositionLeft, SVGPositionRight } from '@/assets'

export interface WidgetPositionSelectorProps {
  defaultValue?: PositionType
  onChange?: (value: PositionType) => void
  className?: string
}

const widgetPositionOptions: Option<PositionType>[] = [
  {
    id: 'position-left',
    label: 'Left',
    value: PositionType.Left,
    icon: <SVGPositionLeft className="w-11 h-11" />
  },
  {
    id: 'position-right',
    label: 'Right',
    value: PositionType.Right,
    icon: <SVGPositionRight className="w-11 h-11" />
  },
  {
    id: 'position-empty',
    label: '',
    value: PositionType.Right,
    icon: <div className="w-11 h-11 hidden xl:invisible" />
  }
]

export function WidgetPositionSelector({
  defaultValue = PositionType.Right,
  onChange,
  className
}: WidgetPositionSelectorProps) {
  return (
    <OptionSelector
      options={widgetPositionOptions}
      defaultValue={defaultValue}
      onChange={onChange}
      className={cx('xl:flex-row flex-col gap-md', className)}
    />
  )
}
