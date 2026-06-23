import { type ComponentProps, useEffect, useRef } from 'react'
import { cx } from 'class-variance-authority'
import { InputField } from './InputField'

type InputFieldProps = ComponentProps<typeof InputField>
interface Props extends Omit<InputFieldProps, 'onChange'> {
  onChange: (value: number) => void
  min: number
  max?: number
  /** Max floating point digits allowed. Set to 0 to allow only integers. */
  precision?: number
  value?: string | number
}

export const InputFieldNumeric = ({
  value,
  onChange,
  min,
  max,
  precision = 0,
  maxLength,
  ...props
}: Props) => {
  const ref = useRef<HTMLInputElement>(null)
  const setValue = (value: string) => {
    ref.current!.value = value
  }

  const handleChange: InputFieldProps['onChange'] = (ev) => {
    const val = ev.currentTarget.value.trim()
    if (!val) return
    let value = Number(val)
    if (Number.isFinite(value)) {
      if (typeof min === 'number' && value < min) value = min
      onChange(Number(value.toFixed(precision)))
    }
  }

  const handleBlur: InputFieldProps['onBlur'] = (ev) => {
    const value = (() => {
      let val = Number(ev.currentTarget.value)
      if (Number.isNaN(val)) val = 1
      if (typeof min === 'number' && val < min) return min
      if (typeof max === 'number' && val > max) return max
      return Number(val.toFixed(precision))
    })()
    setValue(value.toString())
    onChange(value)
  }

  const handleKeyDown: InputFieldProps['onKeyDown'] = (ev) => {
    if (
      ev.ctrlKey ||
      ev.metaKey ||
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(ev.key)
    ) {
      return
    }

    const val = ev.currentTarget.value
    if (val.includes('.') && ev.key === '.') {
      return ev.preventDefault()
    }
    if (typeof maxLength === 'number' && val.length >= maxLength) {
      return ev.preventDefault()
    }
    if (isNonNumericKey(ev)) return ev.preventDefault()
    if (ev.key !== 'ArrowUp' && ev.key !== 'ArrowDown') return

    const delta = (ev.key === 'ArrowUp' ? 1 : -1) * Math.pow(10, -precision)
    const newValue = Number((Number(val) + delta).toFixed(precision))
    if (typeof min === 'number' && newValue < min) return
    if (typeof max === 'number' && newValue > max) return
    setValue(newValue.toFixed(precision))
    onChange(newValue)
    props.onKeyDown?.(ev)
  }

  useEffect(() => {
    if (typeof value !== 'undefined') {
      setValue(value.toString())
    }
  }, [value])

  return (
    <InputField
      defaultValue={value}
      onChange={handleChange}
      inputMode="decimal"
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      ref={ref}
      {...props}
      className={cx('tabular-nums', props.className)}
    />
  )
}

function isNonNumericKey(ev: React.KeyboardEvent<HTMLInputElement>) {
  return (
    ev.key.length === 1 && !/^[\d.]$/.test(ev.key) && !ev.ctrlKey && !ev.metaKey
  )
}

InputFieldNumeric.displayName = 'InputFieldNumeric'
