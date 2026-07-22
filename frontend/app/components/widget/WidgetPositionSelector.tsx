import { SVGPositionLeft, SVGPositionRight } from '@/assets'
import {
  PositionSelectorInput,
  type Option,
} from '@/components/builder/PositionSelectorInput'
import { WIDGET_POSITION, type WidgetPositionKey } from '@shared/types'

export interface WidgetPositionSelectorProps {
  value: WidgetPositionKey
  onChange: (value: WidgetPositionKey) => void
}

const widgetPositionOptions: Option<WidgetPositionKey>[] = [
  {
    label: 'Left',
    value: WIDGET_POSITION.Left,
    icon: <SVGPositionLeft className="w-[44px] h-[44px]" />,
  },
  {
    label: 'Right',
    value: WIDGET_POSITION.Right,
    icon: <SVGPositionRight className="w-[44px] h-[44px]" />,
  },
]

export function WidgetPositionSelector({
  value,
  onChange,
}: WidgetPositionSelectorProps) {
  return (
    <PositionSelectorInput
      value={value}
      onChange={onChange}
      options={widgetPositionOptions}
    />
  )
}
