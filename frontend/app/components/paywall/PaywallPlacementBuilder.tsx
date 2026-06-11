import { useId } from 'react'
import { cx } from 'class-variance-authority'
import { InputFieldNumeric } from '@/components/InputFieldNumeric'
import type { PaywallProfile } from '@shared/types'
import { useTranslation } from '~/i18n/useTranslation'
import { usePaywallProfile } from '~/stores/paywall-store'

export function PaywallPlacementBuilder() {
  const [snap, profile] = usePaywallProfile()
  const t = useTranslation('paywall')

  return (
    <>
      <fieldset>
        <legend className="flex justify-between items-center w-full">
          <span className="text-style-body-emphasis">
            {t('inputgroup.placement.title')}
          </span>
        </legend>
        <p className="text-style-small-standard mt-xs mb-md">
          {t('inputgroup.placement.desc')}
        </p>

        <PaywallCoverageInput
          value={snap.behavior.coverage.value}
          onChange={(value) => {
            profile.behavior.coverage.value = value
          }}
        />

        <div className="h-md"></div>

        <PaywallDelayInput
          value={snap.behavior.delay.value}
          onChange={(value) => {
            profile.behavior.delay.value = value
          }}
        />
      </fieldset>
    </>
  )
}

type CoverageAmount = PaywallProfile['behavior']['coverage']['value']
const coverageOptions: { value: CoverageAmount; text: string }[] = [
  { value: 25, text: '25%' },
  { value: 50, text: '50%' },
  { value: 75, text: '75%' },
  { value: 100, text: '100%' },
]
function PaywallCoverageInput({
  value,
  onChange,
}: {
  value: CoverageAmount
  onChange(value: CoverageAmount): void
}) {
  const id = useId()
  const t = useTranslation('paywall')

  return (
    <fieldset className="space-y-2xs">
      <legend className="text-style-caption-standard !text-field-helpertext-default">
        {t('input.coverage.label')}
      </legend>
      <div className="grid grid-cols-4 gap-1 p-2xs rounded-sm border border-interface-edge-container bg-tabs-bg-default">
        {coverageOptions.map(({ value: val, text }) => (
          <label
            key={val}
            className={cx(
              'text-sm py-sm px-md rounded-sm text-center  border ',
              val === value
                ? 'bg-white text-text-buttons-default border-text-buttons-default '
                : 'text-tabs-inactive-default border-transparent',
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
      <p className="text-style-caption-standard !text-field-helpertext-default">
        {t('input.coverage.hint')}
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
  const t = useTranslation('paywall')
  return (
    <InputFieldNumeric
      label={t('input.delay.label')}
      labelClassName="text-style-caption-standard !text-field-helpertext-default"
      inputMode="decimal"
      value={value}
      onChange={onChange}
      helpText={t('input.delay.hint')}
      addonAfter={t('input.delay.suffix')}
      addonClassName="absolute left-12 top-2"
      min={0}
      max={15}
      precision={1}
    />
  )
}
