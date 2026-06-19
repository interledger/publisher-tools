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
    <>
      <fieldset>
        <legend className="flex justify-between items-center w-full">
          <span className="text-style-body-emphasis">
            {t('inputgroup.price.title')}
          </span>
        </legend>
        <p className="text-style-small-standard mt-xs mb-md">
          {t('inputgroup.price.desc')}
        </p>

        <InputFieldNumeric
          label={t('input.price.label')}
          labelClassName="text-style-caption-standard !text-field-helpertext-default"
          value={snap.price.value}
          onChange={(value) => {
            profile.price.value = String(value)
          }}
          helpText={t('input.price.hint', { currency })}
          addonBefore={currencySymbol}
          addonClassName="inline-block pr-2"
          precision={precision}
          min={Math.pow(10, -precision)}
        />
      </fieldset>
    </>
  )
}
