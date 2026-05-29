import { useTranslation } from '~/i18n/useTranslation'
import { usePaywallProfile } from '~/stores/paywall-store'
import { InputField } from '../redesign/components'

export function PaywallPriceBuilder() {
  const [snap, profile] = usePaywallProfile()
  const t = useTranslation('paywall')

  const currency = snap.price.currency

  return (
    <div className="bg-white shadow-sm rounded-xl p-4">
      <fieldset className="space-y-4">
        <legend className="flex justify-between items-center w-full">
          <span className="text-style-body-emphasis">
            {t('inputgroup.price.title')}
          </span>
          <span className="text-style-small-standard !text-text-secondary">
            {t('inputgroup.price.titleDesc')}
          </span>
        </legend>
        <p className="text-style-small-standard !text-text-secondary">
          {t('inputgroup.price.desc')}
        </p>

        <InputField
          label={t('input.price.label')}
          value={snap.price.value}
          onChange={(ev) => {
            profile.price.value = ev.currentTarget.value
          }}
          helpText={t('input.price.hint', { currency })}
        />
      </fieldset>
    </div>
  )
}
