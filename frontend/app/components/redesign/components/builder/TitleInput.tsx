import { useState, useEffect } from 'react'
import Divider from '../Divider'
import { InputField } from '../InputField'
import PillRadioListItem from '../PillRadioListItem'

interface Props {
  value: string
  onChange: (title: string) => void
  suggestions: string[]
  maxLength: number
  helpText?: string
}

export function TitleInput({
  value,
  suggestions,
  onChange,
  maxLength,
  helpText
}: Props) {
  return (
    <>
      <SuggestedTitles
        value={value}
        onChange={onChange}
        suggestions={suggestions}
      />
      <Divider />

      <CustomTitle
        value={value}
        onChange={onChange}
        placeholder={suggestions[0]}
        maxLength={maxLength}
        helpText={helpText}
      />
    </>
  )
}

function SuggestedTitles({
  value,
  suggestions,
  onChange
}: Pick<Props, 'value' | 'suggestions' | 'onChange'>) {
  return (
    <div
      role="group"
      aria-labelledby="label-suggested-title"
      className="flex flex-col gap-xs"
    >
      <div
        id="label-suggested-title"
        className="text-base leading-md font-bold text-text-primary"
      >
        Suggested title
      </div>
      <div
        className="flex flex-wrap gap-xs group"
        onChange={(ev) => {
          const input = ev.target as HTMLInputElement
          onChange(input.value)
        }}
      >
        {suggestions.map((title) => (
          <PillRadioListItem
            key={title}
            value={title}
            selected={value === title}
            radioGroup="suggested-title"
          >
            {title}
          </PillRadioListItem>
        ))}
      </div>
    </div>
  )
}

function CustomTitle({
  value,
  onChange,
  placeholder,
  maxLength,
  helpText
}: Omit<Props, 'suggestions'> & { placeholder: string }) {
  const [inputValue, setInputValue] = useState(value)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    onChange(value.trim())
  }

  return (
    <div className="flex flex-col gap-xs">
      <h4 className="text-base leading-md font-bold text-text-primary">
        Custom title
      </h4>
      <InputField
        value={inputValue}
        placeholder={placeholder}
        onChange={handleChange}
        showCounter={true}
        currentLength={inputValue.length}
        maxLength={maxLength}
        helpText={helpText}
        className="h-12 text-base leading-md"
      />
    </div>
  )
}
