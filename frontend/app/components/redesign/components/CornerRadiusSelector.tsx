import React from 'react'
import { cx } from 'class-variance-authority'
import { OptionSelector, type Option } from './OptionSelector'
import { CORNER_OPTION, type CornerType } from '@shared/types'

export interface CornerRadiusSelectorProps {
  defaultValue?: CornerType
  onChange?: (value: CornerType) => void
  className?: string
}

const cornerRadiusOptions: Option<CornerType>[] = [
  { id: 'no-rounding', label: 'No rounding', value: CORNER_OPTION.None },
  { id: 'light-rounding', label: 'Light rounding', value: CORNER_OPTION.Light },
  { id: 'pill-rounding', label: 'Pill rounding', value: CORNER_OPTION.Pill }
]

export function CornerRadiusSelector({
  defaultValue = CORNER_OPTION.Light,
  onChange,
  className
}: CornerRadiusSelectorProps) {
  return (
    <OptionSelector
      options={cornerRadiusOptions}
      defaultValue={defaultValue}
      onChange={onChange}
      className={cx('xl:flex-row flex-col gap-md', className)}
    />
  )
}
