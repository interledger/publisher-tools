import type { WebComponentProps } from '@lit/react'
import type { PaymentWidget, OfferwallModal } from '@tools/components'

declare global {
  interface HTMLElementTagNameMap {
    'wm-payment-widget': PaymentWidget
    'wm-offerwall': OfferwallModal
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'wm-payment-widget': WebComponentProps<PaymentWidget>
      'wm-offerwall': WebComponentProps<OfferwallModal>
    }
  }
}
