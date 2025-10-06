import React from 'react'
import { cx } from 'class-variance-authority'
import { OptionSelector, type Option } from './OptionSelector'
import { BANNER_POSITION, type BannerPositionKey } from '@shared/types'

export interface BannerPositionSelectorProps {
  defaultValue?: BannerPositionKey
  onChange?: (value: BannerPositionKey) => void
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

const bannerPositionOptions: Option<BannerPositionKey>[] = [
  {
    id: 'position-bottom',
    label: 'Bottom',
    value: BANNER_POSITION.Bottom,
    icon: <PositionBottom />
  },
  {
    id: 'position-top',
    label: 'Top',
    value: BANNER_POSITION.Top,
    icon: <PositionTop />
  },
  {
    id: 'position-empty',
    label: '',
    value: BANNER_POSITION.Empty,
    icon: <div className="w-11 h-11 hidden xl:invisible" />
  }
]

export function BannerPositionSelector({
  defaultValue = BANNER_POSITION.Bottom,
  onChange,
  className
}: BannerPositionSelectorProps) {
  return (
    <OptionSelector
      options={bannerPositionOptions}
      defaultValue={defaultValue}
      onChange={onChange}
      className={cx('xl:flex-row flex-col gap-md', className)}
    />
  )
}
