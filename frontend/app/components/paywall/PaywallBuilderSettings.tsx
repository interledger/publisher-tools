import { Divider } from '@/components'
import { useTranslation } from '~/i18n/useTranslation'
import { PaywallPlacementBuilder } from './PaywallPlacementBuilder'
import { PaywallPriceBuilder } from './PaywallPriceBuilder'
import { Heading5 } from '../redesign/Typography'

export function PaywallBuilderSettings() {
  const t = useTranslation('paywall')
  return (
    <div className="bg-white shadow-xs rounded-xl p-md">
      <Heading5 className="mb-sm">{t('section.settings.title')}</Heading5>

      <PaywallPriceBuilder />
      <Divider className="mt-md mb-lg" />
      <PaywallPlacementBuilder />
    </div>
  )
}
