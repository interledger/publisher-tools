import Checkbox from '../Checkbox'
import { TextareaField } from '../TextareaField'

interface Props {
  label: string
  value: string
  onChange: (text: string) => void
  isVisible: boolean
  onVisibilityChange: (visible: boolean) => void
  maxLength: number
  helpText: string
  placeholder: string
}

export function DescriptionInput({
  label,
  value,
  onChange,
  isVisible,
  onVisibilityChange,
  maxLength,
  helpText,
  placeholder,
}: Props) {
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
