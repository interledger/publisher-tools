import { useId } from 'react'
import { cx } from 'class-variance-authority'
import type { PaywallProfile } from '@shared/types'
import { usePaywallProfile } from '~/stores/paywall-store'
import { InputField } from '../redesign/components'

export function PaywallPlacementBuilder() {
  const [snap, profile] = usePaywallProfile()

  return (
    <div className="bg-white shadow-sm rounded-xl p-4">
      <fieldset className="space-y-4">
        <legend className="flex justify-between items-center w-full">
          <span className="text-style-body-emphasis">Paywall placement</span>
          <span className="text-style-small-standard !text-text-secondary">
            When and how the gate appears
          </span>
        </legend>
        <p className="text-style-small-standard !text-text-secondary">
          Choose how much of the page the paywall covers, and when it appears to
          the visitor.
        </p>
        <PaywallCoverageInput
          value={snap.behavior.coverage.value}
          onChange={(value) => {
            profile.behavior.coverage.value = value
          }}
        />

        <PaywallDelayInput
          value={snap.behavior.delay.value}
          onChange={(value) => {
            profile.behavior.delay.value = value
          }}
        />
      </fieldset>
    </div>
  )
}

type CoverageAmount = PaywallProfile['behavior']['coverage']['value']
function PaywallCoverageInput({
  value,
  onChange,
}: {
  value: CoverageAmount
  onChange(value: CoverageAmount): void
}) {
  const id = useId()
  const options: { value: CoverageAmount; text: string }[] = [
    { value: 25, text: '25%' },
    { value: 50, text: '50%' },
    { value: 75, text: '75%' },
    { value: 100, text: 'Full page' },
  ]

  return (
    <fieldset className="space-y-2xs">
      <legend className="text-sm font-medium text-text-primary">
        Coverage on the page
      </legend>
      <div className="flex gap-1 w-fit p-1.5 rounded-sm border border-field-border bg-field-bg-disabled">
        {options.map(({ value: val, text }) => (
          <label
            key={val}
            className={cx(
              'py-1.5 px-3 rounded-xs text-text-primary',
              val === value && 'bg-white shadow-sm',
            )}
          >
            <input
              type="radio"
              value={val}
              className="sr-only"
              name={id}
              onChange={() => onChange(val)}
            />
            <span>{text}</span>
          </label>
        ))}
      </div>
      <p className="text-xs text-text-secondary">
        How much of the screen the paywall takes when it appears.
      </p>
    </fieldset>
  )
}

function PaywallDelayInput({
  value,
  onChange,
}: {
  value: number
  onChange(val: number): void
}) {
  return (
    <InputField
      label="Show paywall after"
      inputMode="decimal"
      value={value}
      onChange={(ev) => {
        const value = Number(ev.currentTarget.value)
        if (!Number.isNaN(value) && Number.isInteger(value) && value >= 0) {
          onChange(value)
        }
      }}
      helpText={'How much of the screen paywall takes when it appears.'}
    />
  )
}
