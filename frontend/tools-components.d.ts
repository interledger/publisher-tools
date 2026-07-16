import type { WebComponentProps } from '@lit/react'
import type {
  PaymentWidget,
  OfferwallModal,
  Paywall,
  Banner,
} from '@tools/components'

declare global {
  interface HTMLElementTagNameMap {
    'wm-banner': Banner
    'wm-payment-widget': PaymentWidget
    'wm-offerwall': OfferwallModal
    'wm-paywall': Paywall
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'wm-banner': WebComponentProps<Banner>
      'wm-payment-widget': WebComponentProps<PaymentWidget>
      'wm-offerwall': WebComponentProps<OfferwallModal>
      'wm-paywall': WebComponentProps<Paywall>
    }
  }
}
