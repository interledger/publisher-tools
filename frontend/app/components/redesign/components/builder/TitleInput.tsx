import { useId } from 'react'
import { InputField } from '../InputField'
import PillRadioListItem from '../PillRadioListItem'

interface Props {
  value: string
  onChange: (title: string) => void
  suggestions: readonly string[]
  maxLength: number
  helpText?: string
}

export function TitleInput({
  value,
  suggestions,
  onChange,
  maxLength,
  helpText,
}: Props) {
  const id = useId()
  const labelId = `${id}-label`
  const inputId = `${id}-input`

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className="flex flex-col gap-xs"
    >
      <label
        id={labelId}
        htmlFor={inputId}
        className="text-base leading-md font-bold text-text-primary"
      >
        Title
      </label>
      <div className="flex flex-wrap gap-xs group">
        {suggestions.map((title) => (
          <PillRadioListItem
            key={title}
            value={title}
            selected={value === title}
            radioGroup={`${id}-suggested-title`}
            onSelect={() => onChange(title)}
          >
            {title}
          </PillRadioListItem>
        ))}
      </div>
      <InputField
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={suggestions[0]}
        maxLength={maxLength}
        helpText={helpText}
        addonAfter={`${value.length} / ${maxLength}`}
        addonClassName="text-xs whitespace-nowrap"
        className="h-[48px] text-base leading-md"
      />
    </div>
  )
}

type CustomTitleProps = Omit<Props, 'suggestions'> & {
  placeholder: string
  label: string
  id: string
}

export function CustomTitle({
  id,
  value,
  onChange,
  placeholder,
  maxLength,
  helpText,
  label,
}: CustomTitleProps) {
  return (
    <div className="flex flex-col gap-xs">
      <label
        htmlFor={id}
        className="text-base leading-md font-bold text-text-primary"
      >
        {label}
      </label>
      <InputField
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        showCounter={true}
        currentLength={value.length}
        maxLength={maxLength}
        helpText={helpText}
        className="h-[48px] text-base leading-md"
      />
    </div>
  )
}
