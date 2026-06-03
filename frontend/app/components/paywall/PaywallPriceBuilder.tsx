import { InputFieldNumeric } from '@/components/InputFieldNumeric'
import { getCurrencySymbol } from '@c/utils'
import { useTranslation } from '~/i18n/useTranslation'
import { usePaywallProfile } from '~/stores/paywall-store'

export function PaywallPriceBuilder() {
  const [snap, profile] = usePaywallProfile()
  const t = useTranslation('paywall')

  const precision = 2 // TODO: get from walletAddressInfo
  const currency = snap.price.currency
  const currencySymbol = getCurrencySymbol(currency)

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

        <InputFieldNumeric
          label={t('input.price.label')}
          value={snap.price.value}
          onChange={(value) => {
            console.log('onChange', { value })
            profile.price.value = String(value)
          }}
          helpText={t('input.price.hint', { currency })}
          addonBefore={currencySymbol}
          addonClassName="inline-block pr-2"
          precision={precision}
          min={Math.pow(10, -precision)}
        />
      </fieldset>
    </div>
  )
}
