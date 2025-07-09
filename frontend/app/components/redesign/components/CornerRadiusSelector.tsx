import React from 'react'
import { OptionSelector, type Option } from './OptionSelector'
import { CornerType } from '~/lib/types'

export interface CornerRadiusSelectorProps {
  defaultValue?: CornerType
  onChange?: (value: CornerType) => void
  className?: string
}

const cornerRadiusOptions: Option<CornerType>[] = [
  { id: 'no-rounding', label: 'No rounding', value: CornerType.None },
  { id: 'light-rounding', label: 'Light rounding', value: CornerType.Light },
  { id: 'pill-rounding', label: 'Pill rounding', value: CornerType.Pill }
]

export function CornerRadiusSelector({
  defaultValue = CornerType.Light,
  onChange,
  className
}: CornerRadiusSelectorProps) {
  return (
    <OptionSelector
      options={cornerRadiusOptions}
      defaultValue={defaultValue}
      onChange={onChange}
      className={`xl:flex-row flex-col gap-md ${className}`}
    />
  )
}
