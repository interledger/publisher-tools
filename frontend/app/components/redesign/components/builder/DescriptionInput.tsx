import { useRef } from 'react'
import Checkbox from '../Checkbox'
import { TextareaField } from '../TextareaField'
import { toolState } from '~/stores/toolStore'
import { useSnapshot } from 'valtio'

interface Props {
  label: string
  onChange: (text: string) => void
  onVisibilityChange: (visible: boolean) => void
  maxLength: number
  helpText: string
  placeholder: string
}

export function BannerDescriptionInput({
  label,
  onChange,
  onVisibilityChange,
  maxLength,
  helpText,
  placeholder
}: Props) {
  const {
    currentConfig: { bannerDescriptionText, bannerDescriptionVisible }
  } = useSnapshot(toolState, { sync: true })
  return (
    <DescriptionInput
      label={label}
      value={bannerDescriptionText}
      onChange={onChange}
      isVisible={bannerDescriptionVisible}
      onVisibilityChange={onVisibilityChange}
      maxLength={maxLength}
      helpText={helpText}
      placeholder={placeholder}
    />
  )
}

export function WidgetDescriptionInput({
  label,
  onChange,
  onVisibilityChange,
  maxLength,
  helpText,
  placeholder
}: Props) {
  const {
    currentConfig: { widgetDescriptionText, widgetDescriptionVisible }
  } = useSnapshot(toolState, { sync: true })
  return (
    <DescriptionInput
      label={label}
      value={widgetDescriptionText}
      onChange={onChange}
      isVisible={widgetDescriptionVisible}
      onVisibilityChange={onVisibilityChange}
      maxLength={maxLength}
      helpText={helpText}
      placeholder={placeholder}
    />
  )
}

export function DescriptionInput({
  label,
  value,
  onChange,
  isVisible,
  onVisibilityChange,
  maxLength,
  helpText,
  placeholder
}: Props & { value: string; isVisible: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  return (
    <fieldset className="space-y-xs">
      <legend className="text-base leading-md font-bold text-text-primary">
        {label}
      </legend>
      <div className="flex gap-lg items-start xl:flex-row flex-col">
        <div className="flex items-center gap-xs shrink-0">
          <Checkbox
            checked={isVisible}
            onChange={onVisibilityChange}
            label="Visible"
          />
        </div>

        <div className="flex-grow w-full">
          <TextareaField
            value={value}
            onChange={(e) => onChange(e.target.value)}
            ref={ref}
            currentLength={value.length || 0}
            maxLength={maxLength}
            showCounter={true}
            helpText={helpText}
            className="h-[84px]"
            placeholder={placeholder}
            disabled={!isVisible}
          />
        </div>
      </div>
    </fieldset>
  )
}
