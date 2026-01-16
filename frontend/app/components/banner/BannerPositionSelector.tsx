import {
  PositionSelectorInput,
  type Option,
} from '@/components/builder/PositionSelectorInput'
import { BANNER_POSITION, type BannerPositionKey } from '@shared/types'

export interface BannerPositionSelectorProps {
  value: BannerPositionKey
  onChange: (value: BannerPositionKey) => void
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
    label: 'Bottom',
    value: BANNER_POSITION.Bottom,
    icon: <PositionBottom />,
  },
  {
    label: 'Top',
    value: BANNER_POSITION.Top,
    icon: <PositionTop />,
  },
]

export function BannerPositionSelector({
  value,
  onChange,
}: BannerPositionSelectorProps) {
  return (
    <PositionSelectorInput
      value={value}
      onChange={onChange}
      options={bannerPositionOptions}
    />
  )
}
