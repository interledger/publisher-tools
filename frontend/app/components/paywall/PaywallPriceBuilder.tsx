import { usePaywallProfile } from '~/stores/paywall-store'
import { InputField } from '../redesign/components'

export function PaywallPriceBuilder() {
  const [snap, profile] = usePaywallProfile()
  const currency = snap.price.currency

  return (
    <div className="bg-white shadow-sm rounded-xl p-4">
      <fieldset className="space-y-4">
        <legend className="flex justify-between items-center w-full">
          <span className="text-style-body-emphasis">Price</span>
          <span className="text-style-small-standard !text-text-secondary">
            What visitors pay to unlock
          </span>
        </legend>
        <p className="text-style-small-standard !text-text-secondary">
          Set the one-time payment amount visitors pay to unlock this page’s
          gated content.
        </p>

        <InputField
          label="Amount"
          value={snap.price.value}
          onChange={(ev) => {
            profile.price.value = ev.currentTarget.value
          }}
          helpText={`Charged in your wallet's currency (${currency})`}
        />
      </fieldset>
    </div>
  )
}
