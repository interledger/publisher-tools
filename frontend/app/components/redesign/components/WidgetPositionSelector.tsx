import React from 'react'
import { cx } from 'class-variance-authority'
import { OptionSelector, type Option } from './OptionSelector'
import { WIDGET_POSITION, type WidgetPositionKey } from '@shared/types'
import { SVGPositionLeft, SVGPositionRight } from '@/assets'

export interface WidgetPositionSelectorProps {
  defaultValue?: WidgetPositionKey
  onChange?: (value: WidgetPositionKey) => void
  className?: string
}

const widgetPositionOptions: Option<WidgetPositionKey>[] = [
  {
    id: 'position-left',
    label: 'Left',
    value: WIDGET_POSITION.Left,
    icon: <SVGPositionLeft className="w-11 h-11" />
  },
  {
    id: 'position-right',
    label: 'Right',
    value: WIDGET_POSITION.Right,
    icon: <SVGPositionRight className="w-11 h-11" />
  },
  {
    id: 'position-empty',
    label: '',
    value: WIDGET_POSITION.Empty,
    icon: <div className="w-11 h-11 hidden xl:invisible" />
  }
]

export function WidgetPositionSelector({
  defaultValue = WIDGET_POSITION.Right,
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
