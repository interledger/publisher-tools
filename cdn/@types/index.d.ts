import type { PaymentWidget } from '@tools/components'
import type { Banner } from '@tools/components/banner'

declare global {
  interface HTMLElementTagNameMap {
    'wm-banner': Banner
    'wm-payment-widget': PaymentWidget
  }
}
