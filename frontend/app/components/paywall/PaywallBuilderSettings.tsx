import { Divider } from '@/components'
import { PaywallPlacementBuilder } from './PaywallPlacementBuilder'
import { PaywallPriceBuilder } from './PaywallPriceBuilder'
import { Heading5 } from '../redesign/Typography'

export function PaywallBuilderSettings() {
  return (
    <div className="bg-white shadow-sm rounded-xl p-4">
      <Heading5 className="mb-sm">Settings</Heading5>

      <PaywallPriceBuilder />
      <Divider className="mt-md mb-lg" />
      <PaywallPlacementBuilder />
    </div>
  )
}
